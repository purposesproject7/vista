# Docker Deployment Guide for Vista Application

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- At least 2GB free RAM
- At least 5GB free disk space

### One-Command Deployment

1. **Clone the repository** (if not already done)
   ```bash
   cd vista
   ```

2. **Create environment file**
   ```bash
   # Copy the example and edit with your values
   copy .env.docker.example .env.docker
   ```
   
   **⚠️ IMPORTANT**: Edit `.env.docker` and set secure passwords and secrets!

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Check service status**
   ```bash
   docker-compose ps
   ```

5. **Access the application**
   - **Frontend**: http://localhost
   - **API**: http://localhost/api
   - **API Direct**: http://localhost:5000
   - **MongoDB**: localhost:27017

---

## 📦 Architecture

### Services

```
┌─────────────────────────────────────────────────┐
│               User Browser                      │
└─────────────────┬───────────────────────────────┘
                  │ http://localhost
                  ▼
┌─────────────────────────────────────────────────┐
│          Nginx Reverse Proxy (Port 80)          │
│  • Routes /api/* → Backend Server               │
│  • Routes /* → Frontend Client                  │
└────────┬─────────────────────┬──────────────────┘
         │                     │
         │ /api/*             │ /*
         ▼                     ▼
┌────────────────────┐  ┌──────────────────────┐
│  Backend Server    │  │  Frontend Client     │
│  (Node.js/Express) │  │  (React/Vite)        │
│  Port: 5000        │  │  Port: 3000          │
└────────┬───────────┘  └──────────────────────┘
         │
         │ MongoDB Connection
         ▼
┌──────────────────────────────────────────────────┐
│           MongoDB Database (Port 27017)          │
│  • Persistent data volume                        │
│  • Automatic initialization                      │
└──────────────────────────────────────────────────┘
```

### Port Mappings

| Service  | Internal Port | External Port | Description                    |
|----------|---------------|---------------|--------------------------------|
| Nginx    | 80            | 80            | Main entry point               |
| Server   | 5000          | 5000          | API (direct access)            |
| Client   | 80            | 3000          | Frontend (direct access)       |
| MongoDB  | 27017         | 27017         | Database                       |

---

## ⚙️ Configuration

### Environment Variables

The `.env.docker` file contains all configuration. **Key variables to set:**

#### MongoDB
- `MONGO_ROOT_USER`: MongoDB admin username (default: admin)
- `MONGO_ROOT_PASSWORD`: **⚠️ CHANGE THIS** - MongoDB admin password

#### Security
- `JWT_SECRET`: **⚠️ CHANGE THIS** - Secret for JWT token signing
  - Generate: `openssl rand -base64 32`

#### Email (for notifications)
- `EMAIL_USER`: Your email address
- `EMAIL_PASS`: Your email app password
- `EMAIL_FROM`: Display name and email for sent emails

#### Admin Account
- `ADMIN_EMAIL`: Initial admin email
- `ADMIN_PASSWORD`: **⚠️ CHANGE THIS** - Initial admin password
- `ADMIN_NAME`: Admin display name
- `ADMIN_EMPLOYEE_ID`: Admin employee ID
- `ADMIN_SCHOOL`: School/department
- `ADMIN_DEPARTMENT`: Department

#### CORS
- `ALLOWED_ORIGINS`: Comma-separated allowed origins
  - Default: `http://localhost,http://localhost:80,http://localhost:3000`

---

## 🛠️ Common Commands

### Starting Services
```bash
# Start all services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d server
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ DELETES DATA)
docker-compose down -v
```

### Viewing Logs
```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View specific service logs
docker-compose logs -f server
docker-compose logs -f mongodb
docker-compose logs -f nginx
```

### Rebuilding After Code Changes
```bash
# Rebuild and restart services
docker-compose up -d --build

# Rebuild specific service
docker-compose build server
docker-compose up -d server
```

### Database Management
```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p your-password

# Backup database
docker-compose exec mongodb mongodump -u admin -p your-password --out /data/backup

# View MongoDB logs
docker-compose logs mongodb
```

### Health Checks
```bash
# Check server health
curl http://localhost:5000/health

# Check via nginx proxy
curl http://localhost/health

# View container health status
docker-compose ps
```

---

## 🔍 Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose logs
```

**Common issues:**
1. **Port already in use**
   - Solution: Stop other services using ports 80, 3000, 5000, or 27017
   - Check: `netstat -ano | findstr :80`

2. **MongoDB authentication failed**
   - Solution: Verify `MONGO_ROOT_USER` and `MONGO_ROOT_PASSWORD` in `.env.docker`

3. **Server can't connect to MongoDB**
   - Wait for MongoDB to fully initialize (30-40 seconds on first run)
   - Check: `docker-compose logs mongodb`

### Application Errors

**Check server logs:**
```bash
docker-compose logs -f server
```

**Common issues:**
1. **JWT_SECRET not set**
   - Solution: Set `JWT_SECRET` in `.env.docker`

2. **CORS errors**
   - Solution: Add your domain to `ALLOWED_ORIGINS` in `.env.docker`

3. **Email sending fails**
   - Solution: Verify `EMAIL_USER` and `EMAIL_PASS` are correct

### Data Persistence Issues

**View volumes:**
```bash
docker volume ls
```

**Inspect volume:**
```bash
docker volume inspect vista_mongodb_data
```

**Backup data:**
```bash
docker run --rm -v vista_mongodb_data:/data -v ${PWD}:/backup ubuntu tar czf /backup/mongo-backup.tar.gz /data
```

---

## 🔐 Security Best Practices

### For Production Deployment

1. **Change all default passwords**
   - MongoDB root password
   - Admin password
   - JWT secret

2. **Use environment-specific configurations**
   - Create separate `.env.docker.production`
   - Never commit actual `.env.docker` to git

3. **Enable HTTPS**
   - Configure nginx with SSL certificates
   - Use Let's Encrypt for free certificates

4. **Restrict network access**
   - Don't expose MongoDB port externally
   - Use firewall rules

5. **Regular backups**
   - Set up automated MongoDB backups
   - Store backups securely off-site

6. **Update regularly**
   - Keep Docker images updated
   - Update dependencies regularly

---

## 📊 Monitoring

### Container Stats
```bash
# Real-time resource usage
docker stats

# Specific container
docker stats vista-server
```

### Disk Usage
```bash
# View Docker disk usage
docker system df

# Detailed volume usage
docker system df -v
```

### Application Logs
All server logs are persisted in `./server/logs/` directory.

---

## 🚀 Production Deployment

### Recommended Changes for Production

1. **Use external MongoDB** (MongoDB Atlas, AWS DocumentDB, etc.)
   - Set `MONGO_URI` in `.env.docker`
   - Remove MongoDB service from `docker-compose.yml`

2. **Configure nginx for HTTPS**
   - Add SSL certificates
   - Update nginx configuration
   - Redirect HTTP to HTTPS

3. **Set resource limits**
   - Add memory and CPU limits to docker-compose.yml
   - Example:
     ```yaml
     services:
       server:
         deploy:
           resources:
             limits:
               cpus: '1'
               memory: 1G
     ```

4. **Use Docker secrets** for sensitive data
   - Instead of environment variables
   - More secure for production

5. **Set up monitoring**
   - Use Prometheus + Grafana
   - Application Performance Monitoring (APM)
   - Log aggregation (ELK stack, Datadog, etc.)

6. **Configure auto-restart policies**
   - Already set to `restart: unless-stopped`
   - Consider using a orchestrator (Kubernetes, Docker Swarm)

---

## 📝 File Structure

```
vista/
├── client/
│   ├── Dockerfile              # Frontend build instructions
│   ├── nginx.conf              # Frontend nginx config
│   └── .env.docker             # Client environment variables
├── server/
│   ├── Dockerfile              # Backend build instructions
│   ├── docker-entrypoint.sh    # Startup script
│   └── logs/                   # Application logs (persisted)
├── nginx/
│   ├── Dockerfile              # Nginx proxy build
│   └── nginx.conf              # Reverse proxy config
├── mongo-init/
│   └── init-mongo.js           # MongoDB initialization
├── docker-compose.yml          # Service orchestration
└── .env.docker                 # Global environment variables
```

---

## 🆘 Getting Help

### View service status
```bash
docker-compose ps
```

### Restart everything
```bash
docker-compose restart
```

### Clean slate (⚠️ DELETES ALL DATA)
```bash
docker-compose down -v
docker-compose up -d --build
```

### Access container shell
```bash
# Server
docker-compose exec server sh

# MongoDB
docker-compose exec mongodb mongosh
```

---

## 📄 License

This deployment configuration is part of the Vista Project Management System.

---

**Need help?** Check the logs first: `docker-compose logs -f`
