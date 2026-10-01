require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase, isUsingFallback } = require('./config/db');
const { initWebSocketServer } = require('./services/socketService');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Mount WebSocket server
initWebSocketServer(server);

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'x-branch-id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'ServeFlow Restaurant POS Backend',
    database: isUsingFallback() ? 'MySQL In-Memory Resilient Provider' : 'Live MySQL Connection Pool',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', routes);

// Serve compiled frontend in production/preview mode
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// 404 Route handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint '${req.originalUrl}' not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

async function startServer() {
  await initDatabase();

  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  ServeFlow Restaurant POS & ERP running on port ${PORT}`);
    console.log(`  Web App: http://localhost:${PORT}`);
    console.log(`  Real-Time WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`  Public QR Menu: http://localhost:${PORT}/menu/restaurant-demo`);
    console.log(`  API Health: http://localhost:${PORT}/api/health`);
    console.log(`  Database Mode: ${isUsingFallback() ? 'In-Memory Resilient Provider (Disk-Synced)' : 'Live MySQL Pool'}`);
    console.log(`======================================================\n`);
  });
}

startServer();
