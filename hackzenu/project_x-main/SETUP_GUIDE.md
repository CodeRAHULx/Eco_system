# SafeRoute AI - Complete Setup Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 16+
- Python 3.9+
- MongoDB 5.0+
- Redis 6.0+

### 1. Clone & Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Start MongoDB & Redis

```bash
# Using Docker (Recommended)
docker run -d -p 27017:27017 --name mongo mongo:6
docker run -d -p 6379:6379 --name redis redis:latest

# Or locally if installed
mongod
redis-server
```

### 3. Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

**Backend running at:** http://localhost:5000

### 4. Setup & Start AI Service

```bash
# Navigate to AI service directory
cd ../ai_service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with Groq API key
nano .env
```

### 5. Start AI Service

```bash
# Using uvicorn
python -m uvicorn ai_service:app --reload --host 0.0.0.0 --port 8000

# Or with custom command
uvicorn ai_service:app --reload
```

**AI Service running at:** http://localhost:8000

### 6. Setup & Start Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm start
```

**Frontend running at:** http://localhost:3000

---

## 🔧 Detailed Configuration

### Backend Configuration (.env)

**Database:**
```env
MONGODB_URI=mongodb://localhost:27017/saferoute
REDIS_HOST=localhost
REDIS_PORT=6379
```

**JWT Security:**
```env
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRY=7d
```

**AI Service:**
```env
AI_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=get_from_https://console.groq.com
```

**CORS & Frontend:**
```env
FRONTEND_URL=http://localhost:3000
```

### AI Service Configuration (.env)

**Groq API:**
```env
GROQ_API_KEY=get_from_https://console.groq.com
GROQ_MODEL=mixtral-8x7b-32768
```

**Local Models (Optional):**
```env
USE_LOCAL_MODELS=false
MODEL_PATH=./models/
```

### Frontend Configuration (.env)

**API Endpoints:**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AI_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:5000
```

**Map APIs (Optional):**
```env
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 📦 Getting Groq API Key (FREE)

1. Visit: https://console.groq.com
2. Sign up with Google/GitHub
3. Create API key
4. Copy key to `.env` files
5. Free tier includes 40 requests/minute

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/saferoute
      - REDIS_HOST=redis
    depends_on:
      - mongo
      - redis

  ai_service:
    build: ./ai_service
    ports:
      - "8000:8000"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:5000
      - REACT_APP_AI_URL=http://ai_service:8000

volumes:
  mongo_data:
```

### Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🚀 Production Deployment

### Option 1: AWS EC2

```bash
# Launch EC2 instance (Ubuntu 22.04)
# SSH into instance

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt-get install -y python3 python3-pip python3-venv

# Install MongoDB & Redis
sudo apt-get install -y mongodb redis-server

# Clone repository
git clone your-repo-url
cd saferoute

# Setup backend
cd backend && npm install && npm start &

# Setup AI service
cd ../ai_service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn ai_service:app &

# Setup frontend
cd ../frontend && npm install && npm run build
# Serve with nginx or similar
```

### Option 2: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create apps
heroku create saferoute-backend
heroku create saferoute-frontend
heroku create saferoute-ai

# Add MongoDB Atlas
heroku addons:create mongolab:sandbox --app saferoute-backend

# Deploy backend
git subtree push --prefix backend heroku main

# Deploy AI service
git subtree push --prefix ai_service heroku main

# Deploy frontend
git subtree push --prefix frontend heroku main
```

### Option 3: DigitalOcean App Platform

```bash
# Using DigitalOcean CLI
doctl apps create --spec app.yaml

# Create app.yaml with services
```

---

## 🧪 Testing the Application

### 1. Test Authentication

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Test Incident Reporting

```bash
# Create incident
curl -X POST http://localhost:5000/api/v1/incidents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "accident",
    "description": "Car accident on Main St",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "Main St, New York"
    }
  }'
```

### 3. Test Emergency SOS

```bash
# Activate emergency
curl -X POST http://localhost:5000/api/v1/emergency/activate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MEDICAL",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "description": "Medical emergency"
  }'
```

### 4. Test AI Analysis

```bash
# Get AI analysis
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Fire spreading rapidly in building",
    "type": "fire",
    "has_photos": true
  }'
```

### 5. Test Risk Assessment

```bash
# Get risk assessment
curl -X GET "http://localhost:5000/api/v1/risk-assessment/40.7128/-74.0060/10"
```

---

## 🔍 Health Checks

### Check Backend Health

```bash
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "uptime": 3600
}
```

### Check AI Service Health

```bash
curl http://localhost:8000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "SafeRoute AI Service",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
mongosh

# If not running, start it
mongod

# Or with Docker
docker run -d -p 27017:27017 mongo:6
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:latest
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 PID
```

### CORS Errors

Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL:
```env
FRONTEND_URL=http://localhost:3000
```

### AI Service Connection Error

Check that `AI_SERVICE_URL` in backend `.env` is correct:
```env
AI_SERVICE_URL=http://localhost:8000
```

### WebSocket Connection Issues

Make sure Socket.io is properly configured:
```javascript
// In backend server.js
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## 📊 Performance Tuning

### Database Indexing

```javascript
// Create indexes for faster queries
db.incidents.createIndex({ "location": "2dsphere" });
db.incidents.createIndex({ "createdAt": -1 });
db.incidents.createIndex({ "severity": 1 });
db.users.createIndex({ "email": 1 }, { unique: true });
```

### Caching

Enabled by default in Redis. Configure TTL in `.env`:
```env
CACHE_TTL=3600  # 1 hour
```

### Load Balancing

For production, use nginx:

```nginx
upstream backend {
  server localhost:5000;
  server localhost:5001;
  server localhost:5002;
}

server {
  listen 80;
  server_name api.saferoute.app;
  
  location / {
    proxy_pass http://backend;
  }
}
```

---

## 📝 Monitoring & Logging

### View Backend Logs

```bash
# Development
npm run dev  # Shows logs in console

# Production
tail -f logs/saferoute.log
```

### View AI Service Logs

```bash
# Check logs
tail -f logs/ai_service.log
```

### Monitor with PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start backend/server.js --name "saferoute-api"
pm2 start ai_service/ai_service.py --name "saferoute-ai" --interpreter python

# Monitor
pm2 monit
pm2 logs
```

---

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to strong value
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Enable API authentication
- [ ] Validate all inputs
- [ ] Use CSRF protection
- [ ] Monitor for suspicious activity

---

## 📱 API Documentation

### Backend API Docs
- Swagger UI: http://localhost:5000/api/docs (add if using swagger-ui)
- Postman Collection: `./docs/SafeRoute-API.postman_collection.json`

### AI Service API Docs
- FastAPI Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🆘 Getting Help

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :PORT` and kill process |
| Cannot connect to MongoDB | Check MongoDB is running: `mongosh` |
| Cannot connect to Redis | Check Redis is running: `redis-cli ping` |
| CORS error | Check FRONTEND_URL in .env |
| Groq API errors | Verify API key is valid |
| WebSocket not connecting | Check Socket.io CORS config |

### Resources

- Backend Docs: [Express.js](https://expressjs.com/)
- Frontend Docs: [React](https://react.dev/)
- AI Service: [FastAPI](https://fastapi.tiangolo.com/)
- Database: [MongoDB](https://docs.mongodb.com/)
- Real-time: [Socket.io](https://socket.io/docs/)

---

## 📞 Support

For issues, questions, or contributions:
1. Check documentation
2. Review existing issues
3. Create detailed bug report
4. Provide error logs & steps to reproduce

---

**Happy deploying! 🚀**

Version: 1.0.0  
Last Updated: 2026-01-23  
Maintained by: AI Assistant
