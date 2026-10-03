#!/usr/bin/env bash
# =============================================================================
# deploy-rag.sh — switch a host deployed by provision.sh over to this branch
# (duplicate-project check) WITHOUT touching the existing deploy:
#
#   - nginx, ufw, mongod.conf, cron, wazuh: untouched
#   - pm2 vista-api: stopped, not deleted; vista-rag-api takes over :5000
#   - database: new `vista_rag`, copied once from `vista` (read-only on vista)
#   - frontend: /var/www/vista moved to /var/www/vista.pre-rag, new build in place
#
# Run from its own checkout, never the live /opt/vista:
#   sudo git clone -b feat/similarity-check https://github.com/purposesproject7/vista.git /opt/vista-rag
#   sudo /opt/vista-rag/deploy/deploy-rag.sh
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LIVE_DIR="${LIVE_DIR:-/opt/vista}"
RUN_USER="${RUN_USER:-vista}"        # same user provision.sh runs vista-api as
WEB_ROOT=/var/www/vista
OLD_WEB=/var/www/vista.pre-rag
RAG_SECRETS=/etc/vista/rag-secrets.env
MODEL_CACHE=/var/cache/vista/models
RAG_DB=vista_rag

STEP="startup"
c()  { STEP="$*"; echo -e "\033[0;36m[*]\033[0m $*"; }
ok() { echo -e "\033[0;32m[+]\033[0m $*"; }
die(){ echo -e "\033[0;31m[!]\033[0m $*" >&2; exit 1; }
trap 'rc=$?; echo -e "\n\033[0;31m[!] FAILED during: ${STEP} (line $LINENO, exit $rc)\033[0m" >&2' ERR

[ "$(id -u)" = 0 ] || die "run as root"
[ "$(realpath "$APP_DIR")" != "$(realpath "$LIVE_DIR" 2>/dev/null || echo none)" ] \
  || die "this is the live checkout ($LIVE_DIR) — run from a separate clone"

# Read-only: these files belong to provision.sh.
. /etc/vista/deploy.conf
. /etc/vista/secrets.env

SIMILARITY_FLAG_THRESHOLD="${SIMILARITY_FLAG_THRESHOLD:-85}"
SIMILARITY_REJECT_THRESHOLD="${SIMILARITY_REJECT_THRESHOLD:-95}"
EMBEDDING_MODEL="${EMBEDDING_MODEL:-Xenova/bge-base-en-v1.5}"
REPL_SET="${REPL_SET:-rs0}"
ALLOWED_ORIGINS="https://${DOMAIN}"
for h in ${HTTP_HOSTS:-}; do ALLOWED_ORIGINS="${ALLOWED_ORIGINS},http://${h}"; done

RUN_HOME="/home/$RUN_USER"
PM2="sudo -u $RUN_USER HOME=$RUN_HOME pm2"
ADMIN_URI="mongodb://admin:${MONGO_ROOT_PASSWORD}@127.0.0.1:27017/?authSource=admin&directConnection=true&serverSelectionTimeoutMS=2000"
MSH="mongosh $ADMIN_URI --quiet"

# ---------------------------------------------------------------------------
# 1. Preflight
# ---------------------------------------------------------------------------
c "preflight"
$MSH --eval 'db.adminCommand({ping:1}).ok' >/dev/null || die "cannot reach mongod as admin"
LIVE_CWD=$($PM2 jlist 2>/dev/null | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    const p=(JSON.parse(s||"[]")).find(x=>x.name==="vista-api");
    console.log(p?p.pm2_env.pm_cwd:"");});')
if [ -n "$LIVE_CWD" ]; then
  [ "$(realpath "$LIVE_CWD")" != "$(realpath "$APP_DIR/server")" ] \
    || die "vista-api runs from this checkout — use a separate clone"
  ok "vista-api found (runs from $LIVE_CWD)"
else
  echo "    vista-api not in $RUN_USER's pm2 list — nothing to stop"
fi

# ---------------------------------------------------------------------------
# 2. RAG db user secret (generated once, separate from secrets.env)
# ---------------------------------------------------------------------------
if [ ! -f "$RAG_SECRETS" ]; then
  umask 077
  echo "MONGO_RAG_PASSWORD='$(openssl rand -hex 24)'" > "$RAG_SECRETS"
  umask 022
  ok "generated $RAG_SECRETS"
fi
. "$RAG_SECRETS"

# ---------------------------------------------------------------------------
# 3. Database: vista_rag, copied once from vista
# ---------------------------------------------------------------------------
c "creating $RAG_DB user"
$MSH --eval "
  const r = db.getSiblingDB('$RAG_DB');
  if (!r.getUser('$RAG_DB')) r.createUser({user:'$RAG_DB',pwd:'${MONGO_RAG_PASSWORD}',
    roles:[{role:'readWrite',db:'$RAG_DB'}]});" >/dev/null

COUNTS_JS="const d=db.getSiblingDB('vista');
  JSON.stringify(d.getCollectionNames().sort().map(n=>[n,d.getCollection(n).countDocuments()]))"
if [ "$($MSH --eval "db.getSiblingDB('$RAG_DB').getCollectionNames().length")" = "0" ]; then
  c "copying vista -> $RAG_DB (vista is only read)"
  BEFORE=$($MSH --eval "$COUNTS_JS")
  # No --drop: mongorestore only inserts, and only into vista_rag.*.
  mongodump --uri="$ADMIN_URI" --db=vista --archive --quiet \
    | mongorestore --uri="$ADMIN_URI" --archive --quiet \
                   --nsFrom='vista.*' --nsTo="${RAG_DB}.*"
  AFTER=$($MSH --eval "$COUNTS_JS")
  [ "$BEFORE" = "$AFTER" ] && ok "copied; vista doc counts unchanged" \
    || echo "    vista counts changed during copy — the live app was still serving writes"
else
  ok "$RAG_DB already has data; not copying again"
fi
MONGO_URI="mongodb://${RAG_DB}:${MONGO_RAG_PASSWORD}@127.0.0.1:27017/${RAG_DB}?authSource=${RAG_DB}&replicaSet=${REPL_SET}"

# ---------------------------------------------------------------------------
# 4. server/.env (same as provision.sh, pointed at vista_rag)
# ---------------------------------------------------------------------------
c "writing $APP_DIR/server/.env"
umask 077
cat > "$APP_DIR/server/.env" <<EOF
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
LOG_LEVEL=info

MONGO_URI=${MONGO_URI}
MONGODB_URI=${MONGO_URI}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=1h

ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
FRONTEND_URL=https://${DOMAIN}

EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
EMAIL_FROM=Vista System <${EMAIL_USER}>

ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=${ADMIN_NAME}
ADMIN_EMPLOYEE_ID=${ADMIN_EMPLOYEE_ID}
ADMIN_SCHOOL=${ADMIN_SCHOOL}
ADMIN_DEPARTMENT=${ADMIN_DEPARTMENT}

SIMILARITY_FLAG_THRESHOLD=${SIMILARITY_FLAG_THRESHOLD}
SIMILARITY_REJECT_THRESHOLD=${SIMILARITY_REJECT_THRESHOLD}
EMBEDDING_MODEL=${EMBEDDING_MODEL}
EOF
umask 022
printf 'VITE_API_BASE_URL=/api\n' > "$APP_DIR/client/.env.production.local"

# ---------------------------------------------------------------------------
# 5. Build
# ---------------------------------------------------------------------------
c "installing server deps"
(cd "$APP_DIR/server" && npm ci --omit=dev --silent)
c "building client"
(cd "$APP_DIR/client" && npm ci --silent && npm run build)
mkdir -p "$APP_DIR/server/logs"
chown -R "$RUN_USER":"$RUN_USER" "$APP_DIR/server"
chmod 640 "$APP_DIR/server/.env"

# ---------------------------------------------------------------------------
# 6. Embedding model + backfill (writes into vista_rag only)
# ---------------------------------------------------------------------------
c "setting up the embedding model ($EMBEDDING_MODEL)"
install -d -o "$RUN_USER" -g "$RUN_USER" -m 755 "$MODEL_CACHE"
TF_CACHE="$APP_DIR/server/node_modules/@huggingface/transformers/.cache"
rm -rf "$TF_CACHE"
ln -s "$MODEL_CACHE" "$TF_CACHE"
sudo -u "$RUN_USER" HOME="$RUN_HOME" bash -c "cd '$APP_DIR/server' && node scripts/backfillEmbeddings.js" \
  && ok "model cached; $RAG_DB projects embedded" \
  || echo "  -> embedding backfill FAILED. Re-run: sudo -u $RUN_USER bash -c 'cd $APP_DIR/server && node scripts/backfillEmbeddings.js'"

# ---------------------------------------------------------------------------
# 7. Frontend swap (old build kept once; re-runs never overwrite it)
# ---------------------------------------------------------------------------
c "swapping frontend build"
if [ ! -e "$OLD_WEB" ]; then
  mv "$WEB_ROOT" "$OLD_WEB"
  ok "old build kept at $OLD_WEB"
fi
rm -rf "$WEB_ROOT"
mkdir -p "$WEB_ROOT"
cp -r "$APP_DIR/client/dist/." "$WEB_ROOT/"
chown -R "$RUN_USER":"$RUN_USER" "$WEB_ROOT"

# ---------------------------------------------------------------------------
# 8. pm2: stop (not delete) vista-api, start vista-rag-api on :5000
# ---------------------------------------------------------------------------
c "switching pm2 to vista-rag-api"
cd "$APP_DIR/server"
[ -n "$LIVE_CWD" ] && $PM2 stop vista-api >/dev/null
$PM2 delete vista-rag-api >/dev/null 2>&1 || true
$PM2 start "$APP_DIR/server/index.js" --name vista-rag-api \
    --cwd "$APP_DIR/server" --time --max-memory-restart 1500M >/dev/null
$PM2 save >/dev/null
cd /

# ---------------------------------------------------------------------------
# 9. Verify
# ---------------------------------------------------------------------------
echo
c "verifying"
fail=0
pm2_status() { $PM2 jlist | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    const p=JSON.parse(s).find(x=>x.name===process.argv[1]);
    console.log(p?p.pm2_env.status:"missing");});' "$1"; }
if [ -n "$LIVE_CWD" ]; then
  [ "$(pm2_status vista-api)" = stopped ] && ok "vista-api stopped (kept in pm2)" \
    || { echo "    vista-api is $(pm2_status vista-api)"; fail=1; }
fi
sleep 3
[ "$(pm2_status vista-rag-api)" = online ] && ok "vista-rag-api online" \
  || { echo "    vista-rag-api is $(pm2_status vista-rag-api) — pm2 logs vista-rag-api"; fail=1; }
curl -fsS http://127.0.0.1:5000/health >/dev/null && ok "API /health 200" \
  || { echo "    API health FAILED — pm2 logs vista-rag-api"; fail=1; }
curl -fsS http://127.0.0.1/health >/dev/null 2>&1 && ok "/health through nginx" \
  || echo "    (nginx health check failed — may only answer on DOMAIN/HTTP_HOSTS)"
[ -s "$WEB_ROOT/index.html" ] && ok "new build in $WEB_ROOT" || { echo "    build MISSING"; fail=1; }
[ -s "$OLD_WEB/index.html" ] && ok "old build kept in $OLD_WEB" || { echo "    old build MISSING"; fail=1; }
sudo -u "$RUN_USER" HOME="$RUN_HOME" bash -c "cd '$APP_DIR/server' && node scripts/similarityCheck.js" >/dev/null 2>&1 \
  && ok "duplicate-project check passes" \
  || { echo "    similarity check FAILED — cd $APP_DIR/server && node scripts/similarityCheck.js"; fail=1; }

echo
echo "Deployed $(git -C "$APP_DIR" rev-parse --abbrev-ref HEAD) @ $(git -C "$APP_DIR" rev-parse --short HEAD) on db $RAG_DB"
echo "REVERT to the old deploy:"
echo "  sudo -u $RUN_USER HOME=$RUN_HOME pm2 stop vista-rag-api"
echo "  sudo -u $RUN_USER HOME=$RUN_HOME pm2 start vista-api"
echo "  sudo -u $RUN_USER HOME=$RUN_HOME pm2 save"
echo "  sudo rm -rf $WEB_ROOT && sudo mv $OLD_WEB $WEB_ROOT"
exit $fail
