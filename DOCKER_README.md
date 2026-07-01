# Docker Deployment Guide — Vista (CPMS)

## Quick Start

```bash
# One command — everything is automated
cd /path/to/vista
chmod +x deploy.sh
./deploy.sh
```

Answer 6-7 prompts, wait 2-3 minutes, and the application is live at your domain/IP.

---

## Prerequisites

| Requirement | Minimum |
|-------------|---------|
| Docker Engine | 20.10+ |
| Docker Compose plugin | 2.0+ |
| RAM | 2 GB free |
| Disk | 5 GB free |
| OpenSSL | (for secret generation) |

Check:
```bash
docker --version && docker compose version && openssl version
```

---

## Deployment

### Interactive (recommended)

```bash
cd /path/to/vista
chmod +x deploy.sh && ./deploy.sh
```

The script will prompt for:

1. **Server domain or IP** — e.g. `vista.vit.ac.in` or `172.16.92.64` (auto-detected if available)
2. **Enable HTTPS?** — requires SSL certificate file paths
3. **SSL cert path** — e.g. `/etc/nginx/ssl/star_vit_ac_in.crt`
4. **SSL key path** — e.g. `/etc/nginx/ssl/star_vit_ac_in.key`
5. **Multi-service?** — enables separate backend + MongoDB for `/multi/` routing
6. **Configuration values** — MongoDB user, JWT expiry, CORS origins, admin account, email (optional)

After answering, it:
- Generates cryptographic secrets → `./secrets/*.txt`
- Creates `.env` with your configuration
- Generates nginx configs with your domain and settings
- **Builds and starts everything** with `docker compose up -d --build`

### Quick / Non-interactive

```bash
./deploy.sh --quick
```

Auto-detects domain, checks for existing SSL certs at standard paths, skips all prompts. Useful for re-deployment after the first interactive run.

---

## Architecture

```
User
  │
  ├── HTTP  :80 ──┐
  └── HTTPS :443 ──┤  (if SSL enabled)
                   ▼
        ┌──────────────────┐
        │  WAF Edge Proxy  │  ModSecurity + OWASP CRS 4.x
        │  (owasp/modsecurity-crs:nginx-alpine)
        └───────┬──────────┘
                │
        ┌───────▼──────────┐
        │  Internal Nginx   │  Reverse proxy (vista-nginx)
        └───┬──────────┬───┘
            │          │
    ┌───────▼──┐ ┌─────▼──────┐
    │ Frontend  │ │  Backend   │
    │ (React)   │ │ (Express)  │
    │ :80       │ │ :5000      │
    └───────────┘ └─────┬──────┘
                        │
                 ┌──────▼──────┐
                 │   MongoDB   │
                 │   :27017    │
                 └─────────────┘

    /multi/ (optional)
    ┌───────▼──────────┐
    │  Internal Nginx   │  Additional location block
    └───┬────────────────┘
        │
    ┌───▼──────────┐   ┌──────────────┐
    │ Multi Server  │   │ Multi MongoDB│
    │ (Express)     │   │ (separate DB)│
    │ :5001         │   │ :27017       │
    └───────────────┘   └──────────────┘
```

### Container Map

| Container | Role | Internal port |
|-----------|------|---------------|
| `vista-waf` | ModSecurity WAF (edge) | 80 / 443 (SSL) |
| `vista-nginx` | Reverse proxy | 80 |
| `vista-client` | React/Vite SPA | 80 |
| `vista-server` | Node.js/Express API | 5000 |
| `vista-mongodb` | Main database | 27017 |
| `vista-multi-server` | Multi-service API | 5001 |
| `vista-multi-mongodb` | Multi-service DB | 27017 |
| `vista-prometheus` | Metrics collection | 9090 |
| `vista-cadvisor` | Container metrics | 8080 |
| `vista-node-exporter` | Host metrics | 9100 |
| `vista-grafana` | Monitoring dashboards | 3000 |

---

## Configuration

### What gets generated

| File | Contents | Auto-generated? |
|------|----------|----------------|
| `secrets/jwt_secret.txt` | JWT signing key (64-byte base64) | Yes |
| `secrets/signing_secret.txt` | HMAC signing secret (64-byte hex) | Yes |
| `secrets/mongo_root_password.txt` | MongoDB root password (32-byte base64) | Yes |
| `secrets/admin_password.txt` | Initial admin password | Yes |
| `.env` | Domain, ports, admin info, email config | Yes |
| `nginx/nginx.conf` | Internal reverse proxy config | Yes (by deploy.sh) |
| `waf/nginx.conf` | WAF edge proxy config | Yes (by deploy.sh) |
| `docker-compose.ssl.yml` | SSL cert bind mounts | Yes (if HTTPS) |

All secrets use Docker Compose `secrets:` — they are mounted as files at `/run/secrets/` inside containers, never passed as environment variables.

### Environment variables (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `DOMAIN` | *(auto)* | Nginx server_name |
| `MONGO_ROOT_USER` | `admin` | MongoDB admin username |
| `JWT_EXPIRE` | `1h` | JWT token expiry |
| `ALLOWED_ORIGINS` | `http://DOMAIN` | CORS allowed origins |
| `ADMIN_EMAIL` | `admin@vit.ac.in` | Initial admin login |
| `ADMIN_NAME` | `System Administrator` | Admin display name |
| `ADMIN_EMPLOYEE_ID` | `ADMIN001` | Admin employee ID |
| `ADMIN_SCHOOL` | `SCOPE` | Admin school code |
| `ADMIN_DEPARTMENT` | `CSE` | Admin department |
| `EMAIL_USER` | *(optional)* | SMTP username |
| `EMAIL_PASS` | *(optional)* | SMTP password |
| `EMAIL_FROM` | *(optional)* | SMTP from address |

---

## Access

### Application

| Protocol | URL | When |
|----------|-----|------|
| HTTP | `http://your-domain` | Always |
| HTTPS | `https://your-domain` | Only if SSL enabled |
| API | `http://your-domain/api` | Always |
| Health | `http://your-domain/health` | Always |
| Multi | `http://your-domain/multi/` | Only if multi enabled |

### Admin login

Check the generated password:
```bash
cat secrets/admin_password.txt
```

Login at `http://your-domain` with email `admin@vit.ac.in` (or whatever you set).

### Monitoring (optional — start separately)

```bash
docker compose --profile monitoring up -d
```

| Service | URL |
|---------|-----|
| Prometheus | `http://host-ip:9090` |
| Grafana | `http://host-ip:3001` (admin/admin) |
| cAdvisor | `http://host-ip:8080` |
| Node Exporter | `http://host-ip:9100` |

---

## HTTPS / SSL

### New deployment with SSL

```bash
./deploy.sh
# Answer: Enable HTTPS? y
# Enter: /etc/nginx/ssl/star_vit_ac_in.crt
# Enter: /etc/nginx/ssl/star_vit_ac_in.key
```

The script:
1. Validates the cert files exist
2. Generates `waf/nginx.conf` with SSL termination + HTTP→HTTPS redirect
3. Generates `docker-compose.ssl.yml` to bind-mount certs into the WAF container
4. WAF listens on 443 with TLSv1.2/TLSv1.3, HSTS, and secure ciphers

### Existing cert at standard path

If you have certs at `/etc/nginx/ssl/`, the `--quick` mode auto-detects them:
```bash
./deploy.sh --quick
```

### Using Let's Encrypt

```bash
# Stop any process on port 80
# Get certs (standalone mode)
certbot certonly --standalone -d vista.vit.ac.in

# Deploy
./deploy.sh
# Enter cert path: /etc/letsencrypt/live/vista.vit.ac.in/fullchain.pem
# Enter key path:  /etc/letsencrypt/live/vista.vit.ac.in/privkey.pem
```

Add a cron job for renewal:
```bash
echo "0 3 * * * certbot renew --quiet && docker compose -f /path/to/vista/docker-compose.yml -f /path/to/vista/docker-compose.ssl.yml restart waf" | crontab -
```

---

## Multi-Service (/multi/)

The `/multi/` route runs a **separate instance of the same backend** with its own MongoDB database. Useful for running the same application for a different purpose (e.g., separate academic year).

Enable it during `deploy.sh`:
```
Deploy multi-service? (separate DB for /multi/ routing) [y/N]: y
```

Or manually:
```bash
docker compose --profile multi up -d
```

Multi-service details:
- Container: `vista-multi-server` (port 5001, uses same image as main)
- Database: `vista-multi-mongodb` (separate data volumes)
- Data: `multi_mongodb_data`, `multi_mongodb_config`
- Routing: `/multi/` → nginx strips the prefix → `multi-server:5001/`

---

## Security Features

### WAF (Web Application Firewall)

The WAF runs ModSecurity 3 with OWASP Core Rule Set 4.x, enabled for all traffic:

- SQL injection (rules 942xxx)
- Cross-site scripting (rules 941xxx)
- Remote/Local file inclusion (rules 931xxx, 930xxx)
- Remote code execution (rules 932xxx)
- Protocol enforcement (rules 920xxx)
- Scanner detection (rules 913xxx)
- DOS protection (rules 912xxx)
- IP reputation (rules 910xxx)

### Rate Limiting

| Endpoint | Rate | Burst |
|----------|------|-------|
| Login/auth endpoints | 5 req/min | 5 |
| General API | 100 req/min | 20 |
| Static/frontend | 500 req/min | 100 |

### Docker Security

- `read_only: true` — containers have read-only root filesystem
- `cap_drop: ALL` — all Linux capabilities removed
- `cap_add: [minimal]` — only the capabilities actually needed
- `no-new-privileges:true` — prevents privilege escalation
- `tmpfs` mounts — writable runtime data in memory only
- Resource limits — CPU and memory bounds on every service
- Secrets as files — never in environment variables
- MongoDB bound to 127.0.0.1 — not exposed externally

### Blocked Paths

The WAF blocks access to:
- `.git`, `.env`, `.svn`, `.htaccess` files
- `node_modules/`, `vendor/`, `bin/`, `scripts/` directories
- Common attack patterns (cmd, shell, exec, eval, system, etc.)

---

## Commands

### Deployment

```bash
./deploy.sh                    # Interactive (recommended)
./deploy.sh --quick            # Auto-detect, skip prompts
./deploy.sh --help             # Show help

# Start monitoring stack (after deployment)
docker compose --profile monitoring up -d

# Start multi-service (after deployment)
docker compose --profile multi up -d

# Start everything at once
docker compose --profile multi --profile monitoring up -d

# Rebuild and restart after code changes
./deploy.sh                    # Re-runs config generation + build
# Or manually:
docker compose up -d --build
```

### Logs

```bash
docker compose logs -f                      # All services
docker compose logs -f waf                  # WAF only
docker compose logs -f server               # Backend only
docker compose logs -f nginx                # Internal nginx only
```

### Health

```bash
curl http://localhost/health                # Application health
docker compose ps                           # Container status
```

### Secrets

```bash
# Read a secret
cat secrets/jwt_secret.txt

# Regenerate a specific secret
./secret-tools.sh rotate jwt_secret

# List all secrets
./secret-tools.sh list
```

### Maintenance

```bash
# Disk usage
./docker-cleanup.sh df

# Container stats
./docker-cleanup.sh stats

# Prune unused data
./docker-cleanup.sh all            # Full cleanup (CAUTION: deletes everything unused)
./docker-cleanup.sh logs           # Truncate container logs
./docker-cleanup.sh volumes        # Remove dangling volumes
./docker-cleanup.sh images         # Remove dangling images
```

### Stop / Restart

```bash
# Stop all services (data preserved)
docker compose down

# Stop and delete data (IRREVERSIBLE)
docker compose down -v

# Restart all services
docker compose restart

# Restart a specific service
docker compose restart server
```

---

## Troubleshooting

### WAF fails to start

```bash
docker compose logs waf
```

Common causes:
- `nginx: [emerg] "load_module" directive is specified` — ModSecurity module path mismatch: remove `load_module` line from `waf/nginx.conf` if the image has it compiled statically
- Port 80/443 already in use: `netstat -tulpn | grep :80`

### Server can't connect to MongoDB

```bash
docker compose logs server
```

The server waits up to 60s for MongoDB. If it times out:
```bash
docker compose logs mongodb     # Check MongoDB health
docker compose restart server   # Retry connection
```

### Secrets not found

```bash
# Check secret files exist
ls -la secrets/

# Regenerate
rm -rf secrets/
./deploy.sh
```

### Permission denied on secrets

```bash
chmod 600 secrets/*.txt
chown root:root secrets/*.txt
```

### Application returns 502

The WAF may be blocking legitimate requests. Check WAF logs:
```bash
docker compose logs waf | grep -i "blocked\|denied\|403"
```

If false positives, add exclusion rules to `waf/modsecurity-rules.conf`:
```
# Example: allow a specific user-agent
SecRule REQUEST_HEADERS:User-Agent "@contains MyApp" "id:200001,phase:1,pass,nolog"
```

### Health check fails

```bash
# Check each service
docker compose ps
docker compose logs waf | tail -20
docker compose logs nginx | tail -20
docker compose logs server | tail -20
docker compose logs mongodb | tail -20
```

---

## File Reference

```
vista/
├── deploy.sh                     # → Interactive deployment script
├── secret-tools.sh               # → Secret management utilities
├── docker-cleanup.sh             # → Maintenance utilities
├── docker-compose.yml            # → Service orchestration
├── docker-compose.ssl.yml        # → Generated SSL override (if HTTPS)
├── .env                          # → Generated configuration
├── .gitignore
│
├── nginx/
│   ├── Dockerfile                # → Internal reverse proxy
│   └── nginx.conf                # → Generated at deploy time
│
├── waf/
│   ├── Dockerfile                # → ModSecurity + CRS
│   ├── nginx.conf                # → Generated at deploy time
│   ├── modsecurity-rules.conf    # → Custom WAF rules
│   └── blocked-user-agents.data  # → Blocked scanner list
│
├── server/
│   ├── Dockerfile                # → Multi-stage backend build
│   ├── docker-entrypoint.sh      # → Secret bridge + startup
│   └── .dockerignore
│
├── client/
│   ├── Dockerfile                # → Multi-stage frontend build
│   ├── nginx.conf                # → SPA serving config
│   └── .dockerignore
│
├── monitoring/
│   ├── prometheus.yml            # → Scrape config
│   ├── grafana-datasources.yml   # → Auto-provision datasource
│   └── grafana-dashboards.yml    # → Auto-provision dashboards
│
├── mongo-init/
│   └── init-mongo.js             # → Database initialization
│
└── secrets/                      # → Generated at deploy time
    ├── .gitkeep
    ├── jwt_secret.txt
    ├── signing_secret.txt
    ├── mongo_root_password.txt
    └── admin_password.txt
```

---

## License

Part of the Vista Project Management System (CPMS).
