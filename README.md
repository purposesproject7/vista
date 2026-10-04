# VISTA

Capstone project management portal for VIT. Students register their team's
project, guides and review panels evaluate it across scheduled reviews, and
admins configure everything per school, program and academic year.

## Who uses it

| Role | What they do |
|---|---|
| **Student** | Submits the team's title & abstract (checked for duplicates), sees the guide and panel, review dates and venues, and admin notices. |
| **Faculty: guide** | Accepts or rejects title & abstract submissions, approves PPTs, enters guide marks. |
| **Faculty: panel** | Enters panel marks for the teams assigned to their panel. |
| **Project coordinator** | A faculty member who manages one school/program: students, projects, panels, deadlines. |
| **Admin** | Manages their own school: master data, marking schemas, panels, program settings, broadcasts, reports. |
| **Sudo admin** | The admin whose employee ID matches `ADMIN_EMPLOYEE_ID`. Manages every school, and is the only one who can add, rename or remove schools. |

Highlights:

- **Duplicate-project check.** Each title & abstract submission is compared with approved projects and 100 common project ideas, using a local embedding model; nothing leaves the server. See [SIMILARITY_CHECK.md](SIMILARITY_CHECK.md).
- **Review gating.** Per program, teams can be held out of all reviews until their guide accepts the title & abstract (Admin → Settings → Content Check).
- **Broadcasts.** Notices or temporary access blocks, sent to faculty, students or both, optionally narrowed by school and program.

## Stack

| | |
|---|---|
| Client | React 19, Vite 5, Tailwind CSS (`client/`) |
| Server | Node.js 20, Express 5, Mongoose 9 (`server/`) |
| Database | MongoDB 8 (single-node replica set) |
| Embeddings | `@huggingface/transformers`, `Snowflake/snowflake-arctic-embed-m-v2.0`, runs in-process on CPU |
| Email | Gmail SMTP via nodemailer (OTP password resets, broadcast emails) |
| Production | nginx (TLS) → pm2 → Express; Wazuh agent for monitoring |

## Repository layout

```
client/                 React app
  src/features/<role>/  pages, components and API calls per role
  src/shared/           components, hooks and utils used across roles
  public/               favicon and static files
server/
  index.js              Express entry point
  routes/ controllers/ services/ models/ middlewares/ utils/
  scripts/              one-off admin and maintenance scripts (see below)
  data/                 referenceProjects.json, the duplicate-check baseline
  tests/                feature tests (npm test)
deploy/provision.sh     bare-metal provisioning: the current production setup
deploy.sh, docker-compose.yml, nginx/, waf/, monitoring/
                        alternative Docker deployment (DOCKER_README.md)
```

## Running locally

Prerequisites: Node.js 20 and a MongoDB you can write to.

```bash
cd server
npm install
cp .env.example .env   # then fill in the values below
npm run setup-admin  # creates the sudo admin from the ADMIN_* values
npm run dev          # API on http://localhost:5000
```

```bash
cd client
npm install
npm run dev          # http://localhost:5173, proxies /api to port 5000
```

Sign in at http://localhost:5173 with the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
you set. Student accounts sign in with their `@vitstudent.ac.in` address.

### Server configuration (`server/.env`)

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string. Name the database explicitly (`.../vista?...`); without a name MongoDB uses `test`. |
| `JWT_SECRET` | Signs login tokens. Use a long random value. |
| `JWT_EXPIRE` | Token lifetime, e.g. `1h`. |
| `PORT`, `HOST` | Where the API listens (default `5000`, `0.0.0.0`). |
| `NODE_ENV` | `production` enables rate limiting and production logging. |
| `ALLOWED_ORIGINS`, `FRONTEND_URL` | CORS origins and the link used in emails. |
| `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Gmail address and a Google **app password** (not the account password). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_EMPLOYEE_ID`, `ADMIN_SCHOOL`, `ADMIN_DEPARTMENT` | The sudo admin account. `ADMIN_EMPLOYEE_ID` is what makes an admin the sudo admin. |
| `EMBEDDING_MODEL` | Optional. Changing it requires re-embedding (see below). |
| `SIMILARITY_FLAG_THRESHOLD`, `SIMILARITY_REJECT_THRESHOLD`, `SIMILARITY_REFERENCE_FLAG_THRESHOLD` | Optional overrides for the duplicate-check thresholds (75 / 93 / 70). |

The client needs only `VITE_API_BASE_URL` (`/api` in every environment; see `client/.env.*`).

## Tests

Feature tests start the real server and drive the API as admins, faculty and
students would (`server/tests/*.feature.test.js`). They need a **throwaway**
database whose name ends in `_feature_test`. It is wiped before and after each
run, and the tests refuse to run against any other name.

```bash
cd server
TEST_MONGO_URI="mongodb+srv://<user>:<pass>@<host>/vista_feature_test?..." npm test
```

## Deployment

Production runs on an Ubuntu 22.04/24.04 VM without Docker. Provision it once
as root from the checkout:

```bash
sudo ./deploy/provision.sh
```

It asks for the domain, email and admin settings (saved to
`/etc/vista/deploy.conf`), then installs and configures Node, pm2, MongoDB,
nginx with TLS, the firewall, the Wazuh agent, the embedding model and the
nightly backup. Re-running it is safe.

To deploy new code afterwards, on the server:

```bash
cd /opt/vista && sudo -u $(stat -c %U /opt/vista) git pull origin temp-integration
cd /opt/vista/client && sudo -u $(stat -c %U /opt/vista) npm run build && sudo rm -rf /var/www/vista/* && sudo cp -r dist/. /var/www/vista/
sudo -u vista pm2 restart vista-api
```

Client-only changes need just the first two lines; server changes need the
restart. The Docker alternative is documented in [DOCKER_README.md](DOCKER_README.md).

## Backups

`vista-backup` runs nightly from cron (installed by `provision.sh`). It runs
`mongodump` of the whole `vista` database (including the duplicate-check
embeddings) into `/var/backups/vista`, keeps the 7 newest archives, and uploads
the latest to Google Drive through the rclone remote named in
`/etc/vista/deploy.conf`. Check it with:

```bash
sudo tail /var/log/vista-backup.log
sudo rclone ls gdrive:vista-backups
```

Restore an archive with:

```bash
mongorestore --uri="mongodb://vista:<password>@127.0.0.1:27017/?authSource=vista" --archive=<file>.archive.gz --gzip --drop
```

Embeddings can also be rebuilt from the stored abstracts at any time (needed
after changing `EMBEDDING_MODEL`):

```bash
cd /opt/vista/server && sudo -u vista node scripts/backfillEmbeddings.js
```

## Useful scripts (`server/scripts/`)

| Script | Does |
|---|---|
| `setupAdmin001.js` (`npm run setup-admin`) | Creates or resets the sudo admin from the `ADMIN_*` env values. See [ADMIN_SETUP_README.md](server/scripts/ADMIN_SETUP_README.md). |
| `backfillEmbeddings.js` | Embeds approved projects and the reference projects that have no vector for the current model. |
| `renameProgram.js` | Renames a program across every collection. |

## Branches

`main` is the stable branch. `temp-integration` is what the production server
pulls and deploys. Build features on their own branch and merge them in.
