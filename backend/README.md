# 0G Validator Delegation Backend System

A complete backend system for managing validator delegation requests with admin dashboard.

## 🚀 Features

- **Public Request Form**: Validators submit delegation requests
- **Admin Dashboard**: Foundation team reviews and processes requests  
- **Transaction Tracking**: All blockchain transactions are recorded
- **Status Management**: Track request lifecycle (pending → approved → completed)
- **Audit Logging**: Complete audit trail of all actions
- **Database Storage**: SQLite database for all data

## 📁 System Architecture

```
backend/
├── server.js           # Express server
├── database.js         # Database operations
├── routes/
│   ├── api.js         # API endpoints
│   └── auth.js        # Authentication
├── public/
│   ├── request.html   # Public request form
│   └── admin.html     # Admin dashboard
└── validator_requests.db  # SQLite database
```

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed

### Deploy with Docker
```bash
# 1. Copy environment file
cp .env.docker .env

# 2. Edit .env and change passwords
nano .env

# 3. Start services
docker-compose up -d

# 4. Access the application
# Request Form: http://localhost:3000/request.html
# Admin Dashboard: http://localhost:3000/admin.html
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed Docker deployment instructions.

## 🔧 Manual Setup Instructions (Alternative)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and change:
- `ADMIN_PASSWORD` - Change admin password for frontend authentication

### 3. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Access the System

- **Request Form**: http://localhost:3000/request.html
- **Admin Dashboard**: http://localhost:3000/admin.html
- **API Health Check**: http://localhost:3000/health

## 📝 Workflow

### For Validators (Request Form)

1. Navigate to `/request.html`
2. Fill out validator information:
   - Validator details (moniker, website, etc.)
   - Technical config (commission, pubkey, signature)
   - Contact information
   - Select network (mainnet/testnet)
3. Submit request
4. Receive request ID for tracking

### For Foundation Team (Admin Dashboard)

1. Login to `/admin.html` with admin password
2. View all delegation requests
3. Filter by status or network
4. Click "Process" on pending requests
5. Connect wallet
6. Use validator creation page to:
   - Create validator with foundation stake
   - Transfer ownership to operator
7. Transaction hashes are automatically recorded

## 🗄️ Database Schema

### delegation_requests
- Validator information
- Technical configuration  
- Contact details
- Status tracking
- Transaction hashes
- Timestamps

### transactions
- Individual transaction records
- Gas usage
- Transaction status

### audit_log
- All system actions
- User activities
- IP addresses
- Timestamps

## 🔐 API Endpoints

### Public Endpoints

```
POST /api/requests       - Submit new request
GET  /api/requests/:id   - Get request details
```

### Admin Endpoints (Auth Required)

```
GET  /api/requests       - List all requests
GET  /api/stats         - Get statistics
PUT  /api/requests/:id/status - Update status
POST /api/requests/:id/transaction - Record transaction
```

### Authentication

Frontend-only authentication using session storage. No backend authentication endpoints required.

## 📊 Request Status Flow

```
pending → approved → completed
         ↓
      rejected
```

- **pending**: New request awaiting review
- **approved**: Approved by foundation
- **completed**: Validator created & ownership transferred
- **rejected**: Request denied

## 🔄 Integration with Validator Pages

The admin dashboard integrates with your existing validator creation pages:

1. Admin clicks "Process" on a request
2. Request data is stored in localStorage
3. Validator page opens with pre-filled data
4. After creation, transaction hashes are recorded
5. Status automatically updates to "completed"

## 🛡️ Security Features

- Simple frontend authentication for admin access
- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation
- SQL injection protection (parameterized queries)
- CORS enabled

## 📈 Statistics Tracked

- Total requests
- Pending requests
- Approved requests
- Completed validators
- Network distribution (mainnet/testnet)

## 🔧 Customization

### Change Minimum Stake

Edit in validator pages:
- Mainnet: 500 OG
- Testnet: 32 OG

### Add Custom Fields

1. Update database schema in `database.js`
2. Add fields to request form
3. Update API endpoints
4. Modify admin dashboard display

## 🚨 Important Notes

1. **Change default admin password immediately!**
2. **Backup database regularly**
3. **Monitor disk space (SQLite file grows)**
4. **Consider PostgreSQL for production**
5. **Use HTTPS in production for secure password transmission**

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Database Locked
- Stop all server instances
- Check file permissions

### Cannot Connect Wallet
- Ensure MetaMask is installed
- Check network configuration

## 📝 Production Checklist

- [ ] Change admin password
- [ ] Enable HTTPS (required for secure password transmission)
- [ ] Set up database backups
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Use process manager (PM2)
- [ ] Configure reverse proxy (Nginx)
- [ ] Consider adding backend authentication for production

## 🤝 Support

For issues or questions:
- Check server logs
- Verify database integrity
- Ensure wallet connectivity
- Review transaction hashes on explorer