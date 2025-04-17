const express = require('express');
const path = require('path');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = 8080;
const API_GATEWAY_HOST = process.env.API_GATEWAY_HOST || 'localhost';
const API_GATEWAY_PORT = process.env.API_GATEWAY_PORT || 4000;
const CALENDAR_SERVICE_HOST = process.env.CALENDAR_SERVICE_HOST || 'localhost';
const CALENDAR_SERVICE_PORT = process.env.CALENDAR_SERVICE_PORT || 5005;

// Serve static files from the current directory and dist directory
app.use(express.static(__dirname));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Create directory for React app
app.use('/react-app', express.static(path.join(__dirname, 'react-app')));

// Proxy API requests to calendar service
app.use('/graphql', createProxyMiddleware({ 
  target: `http://${CALENDAR_SERVICE_HOST}:${CALENDAR_SERVICE_PORT}`,
  changeOrigin: true 
}));

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Authentication routes
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'reset-password.html'));
});

app.get('/reset-password-confirm', (req, res) => {
  res.sendFile(path.join(__dirname, 'reset-password-confirm.html'));
});

app.get('/verify-email', (req, res) => {
  res.sendFile(path.join(__dirname, 'verify-email.html'));
});

// Salon registration and management routes
app.get('/salon-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'salon-register.html'));
});

// Admin panel route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Calendar route (serve React app)
app.get('/calendar*', (req, res) => {
  res.sendFile(path.join(__dirname, 'react-app', 'index.html'));
});

// OAuth proxy routes - forward to API Gateway
app.get('/api/auth/:provider', (req, res) => {
  const provider = req.params.provider;
  // Redirect to API gateway OAuth endpoint
  res.redirect(`http://${API_GATEWAY_HOST}:${API_GATEWAY_PORT}/auth/${provider}`);
});

// Legacy routes for backward compatibility
app.get('/auth', (req, res) => {
  console.warn('WARNING: The /auth route is deprecated. Please use /login or /register instead.');
  res.redirect('/login');
});

// Route for the OAuth callback page
app.get('/auth-callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth-callback.html'));
});

// For any other route that doesn't match, check if it's a React route
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/static/') || 
      req.url.startsWith('/api/') || 
      req.url.includes('.')) {
    next(); // Let Express handle static files
  } else if (req.url.startsWith('/calendar')) {
    res.sendFile(path.join(__dirname, 'react-app', 'index.html'));
  } else {
    next();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Frontend client is running at http://localhost:${PORT}`);
  console.log(`Login page available at http://localhost:${PORT}/login`);
  console.log(`Registration page available at http://localhost:${PORT}/register`);
  console.log(`Salon registration page available at http://localhost:${PORT}/salon-register`);
  console.log(`Password reset page available at http://localhost:${PORT}/reset-password`);
  console.log(`Email verification page available at http://localhost:${PORT}/verify-email`);
  console.log(`Calendar available at http://localhost:${PORT}/calendar`);
  console.log(`OAuth endpoints are proxied to http://${API_GATEWAY_HOST}:${API_GATEWAY_PORT}`);
  console.log(`GraphQL API proxied to http://${CALENDAR_SERVICE_HOST}:${CALENDAR_SERVICE_PORT}/graphql`);
});