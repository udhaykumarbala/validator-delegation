# Docker Deployment Guide for 0G Validator Delegation Backend

This guide provides instructions for deploying the 0G Validator Delegation Backend using Docker and Docker Compose with PostgreSQL.

## Prerequisites

- Docker installed (version 20.10 or later)
- Docker Compose installed (version 2.0 or later)
- Git (optional, for cloning the repository)

## Quick Start

### 1. Clone or Copy the Project

```bash
# If using git
git clone <repository-url>
cd validator-delegation/backend

# Or copy the backend folder to your server
```

### 2. Configure Environment Variables

Copy the example environment file and modify it:

```bash
cp .env.docker .env
```

Edit `.env` and update the following:

```env
# Database Configuration
DB_USER=validator_user
DB_PASSWORD=your_secure_password_here  # CHANGE THIS!
DB_NAME=validator_db
DB_TYPE=postgres

# Admin Configuration  
ADMIN_PASSWORD=your_admin_password_here  # CHANGE THIS!

# Server Configuration
PORT=3000
NODE_ENV=production
```

### 3. Build and Start the Services

```bash
# Build and start all services
docker-compose up -d

# Or if you want to see logs
docker-compose up
```

### 4. Verify Deployment

Check if services are running:

```bash
docker-compose ps
```

Access the application:
- Request Form: http://localhost:3000/request.html
- Admin Dashboard: http://localhost:3000/admin.html

## Detailed Configuration

### Docker Compose Services

The `docker-compose.yml` file defines two services:

1. **postgres**: PostgreSQL database
   - Port: 5432
   - Data persisted in Docker volume
   - Health checks enabled

2. **backend**: Node.js application
   - Port: 3000
   - Depends on PostgreSQL
   - Auto-restarts on failure

### Database Configuration

PostgreSQL is automatically initialized with:
- Tables for delegation requests, transactions, and audit logs
- Proper indexes for performance
- Update triggers for timestamp management

### Volumes

- `postgres_data`: Persistent storage for PostgreSQL data
- `./public`: Mounted to allow real-time updates to HTML files

## Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes (WARNING: Deletes data!)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Database Access

Connect to PostgreSQL:

```bash
# Using docker exec
docker exec -it validator-postgres psql -U validator_user -d validator_db

# Using docker-compose
docker-compose exec postgres psql -U validator_user -d validator_db
```

Backup database:

```bash
# Create backup
docker-compose exec postgres pg_dump -U validator_user validator_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U validator_user validator_db < backup.sql
```

### Update Application

To update the application code:

```bash
# Stop services
docker-compose down

# Pull latest code (if using git)
git pull

# Rebuild and start
docker-compose up -d --build
```

## Production Deployment

### 1. Security Considerations

- **Change default passwords** in `.env`
- Use strong passwords (minimum 16 characters)
- Consider using Docker secrets for sensitive data
- Enable SSL/TLS with a reverse proxy

### 2. Reverse Proxy Setup (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. SSL Configuration

Use Certbot for Let's Encrypt SSL:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 4. Backup Strategy

Create automated backups:

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U validator_user validator_db > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

### 5. Monitoring

Monitor container health:

```bash
# Check container status
docker-compose ps

# Check resource usage
docker stats

# Setup health check endpoint monitoring
curl http://localhost:3000/health
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_USER` | PostgreSQL username | validator_user | Yes |
| `DB_PASSWORD` | PostgreSQL password | - | Yes |
| `DB_NAME` | Database name | validator_db | Yes |
| `DB_TYPE` | Database type (postgres/sqlite) | postgres | Yes |
| `DATABASE_URL` | Full database connection string | Auto-generated | No |
| `ADMIN_PASSWORD` | Admin dashboard password | - | Yes |
| `PORT` | Application port | 3000 | No |
| `NODE_ENV` | Environment (production/development) | production | No |

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Port already in use: Change PORT in .env
# - Database connection failed: Check DB credentials
```

### Database Connection Issues

```bash
# Test database connection
docker-compose exec postgres pg_isready -U validator_user

# Check database logs
docker-compose logs postgres
```

### Permission Issues

```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./
```

### Reset Everything

```bash
# Stop and remove everything
docker-compose down -v

# Remove all data (WARNING!)
rm -rf postgres_data

# Rebuild from scratch
docker-compose up -d --build
```

## Performance Tuning

### PostgreSQL Optimization

Add to `docker-compose.yml` under postgres service:

```yaml
command:
  - "postgres"
  - "-c"
  - "max_connections=200"
  - "-c"
  - "shared_buffers=256MB"
  - "-c"
  - "effective_cache_size=1GB"
  - "-c"
  - "maintenance_work_mem=64MB"
```

### Node.js Optimization

For high traffic, use PM2 inside Docker:

```dockerfile
# In Dockerfile
RUN npm install -g pm2
CMD ["pm2-runtime", "start", "server.js", "-i", "max"]
```

## Support

For issues or questions:
- Check container logs: `docker-compose logs`
- Verify database connection: `docker-compose exec postgres pg_isready`
- Test API: `curl http://localhost:3000/health`
- Review this documentation

## Security Checklist

- [ ] Changed default database password
- [ ] Changed admin dashboard password
- [ ] Configured firewall rules
- [ ] Set up SSL/TLS certificate
- [ ] Enabled automated backups
- [ ] Configured monitoring alerts
- [ ] Restricted database access
- [ ] Updated Docker to latest version
- [ ] Configured log rotation
- [ ] Set up intrusion detection