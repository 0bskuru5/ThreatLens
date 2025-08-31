# ThreatLens

A Security Operations Center (SOC) dashboard for monitoring and visualizing security events in real-time.

## Features

- **Failed Login Monitoring**: Track and analyze failed authentication attempts
- **Injection Attack Detection**: Monitor SQL injection, XSS, and command injection attempts
- **IP-based Activity Tracking**: Analyze security events by IP address with geolocation data
- **Real-time Dashboards**: Interactive charts and visualizations for security trends
- **Event Correlation**: Link related security events for better threat analysis
- **Alert Management**: Configurable alerts for critical security events

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Visualization**: Chart.js, D3.js
- **Real-time**: WebSockets
- **Authentication**: JWT

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone repository
git clone https://github.com/0bskuru5/ThreatLens.git
cd ThreatLens

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PgAdmin: http://localhost:5050
```

### Option 2: Local Development
```bash
# Clone repository
git clone https://github.com/0bskuru5/ThreatLens.git
cd ThreatLens

# Backend setup
npm install
cp env.example .env
# Edit .env with your configuration
npm run db:migrate
npm run db:seed

# Frontend setup
cd client
npm install

# Start both services
cd ..
npm run dev
```

## 📋 Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **PostgreSQL 15+** (if running locally)
- **Git**

## 🏗️ Architecture

```
ThreatLens/
├── server/                 # Backend API (Node.js/Express)
│   ├── config/            # Database & configuration
│   ├── models/            # Sequelize models
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic & WebSocket
│   └── scripts/           # DB migrations & seeds
├── client/                # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Dashboard pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utility functions
└── docker/                # Containerization
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=threatlens
DB_USER=threatlens
DB_PASSWORD=your_password

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development

# Email (Optional)
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🧪 Testing

### Backend Tests
```bash
# Run all backend tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit
```

### Frontend Tests
```bash
cd client

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## 🐳 Docker Commands

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Production build
docker-compose build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Clean up volumes
docker-compose down -v
```

## 🚀 Deployment

### Development
```bash
# Start development servers
npm run dev

# Frontend only
cd client && npm run dev

# Backend only
npm run dev:server
```

### Production
```bash
# Build for production
cd client && npm run build

# Start production server
npm start
```

### Cloud Deployment

#### Railway (Backend)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

#### Vercel (Frontend)
```bash
cd client
npm i -g vercel
vercel --prod
```

## 📊 Usage

### First Login
- **URL:** http://localhost:3000
- **Username:** admin
- **Password:** admin123

### Dashboard Features
- **Real-time Security Events** - Live monitoring of threats
- **Interactive Charts** - Drill-down analytics
- **Threat Map** - Geographic visualization
- **Alert Management** - Automated notifications
- **Export Tools** - PDF, CSV, Excel reports

### API Endpoints
- `GET /api/events` - Security events
- `GET /api/dashboard/overview` - Dashboard metrics
- `GET /api/alerts` - Security alerts
- `POST /api/auth/login` - Authentication

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - DDoS protection
- **Input Validation** - XSS and injection prevention
- **CORS Protection** - Cross-origin security
- **Helmet Security** - HTTP security headers

## 📈 Monitoring & Logs

```bash
# View application logs
docker-compose logs -f

# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# Health check
curl http://localhost:3001/health
```

## Project Structure

```
ThreatLens/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Dashboard pages
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   └── hooks/         # Custom React hooks
├── server/
│   ├── routes/        # API routes
│   ├── models/        # Database models
│   ├── middleware/    # Express middleware
│   └── services/      # Business logic
├── public/            # Static assets
├── tests/            # Test files
└── docs/             # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
