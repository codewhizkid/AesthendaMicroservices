const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Serve static files from the current directory and dist directory
app.use(express.static(__dirname));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for the authentication page
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

// Route for the OAuth callback page
app.get('/auth-callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth-callback.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Frontend client is running at http://localhost:${PORT}`);
  console.log(`Authentication page available at http://localhost:${PORT}/auth`);
  console.log(`OAuth callback page available at http://localhost:${PORT}/auth-callback`);
});