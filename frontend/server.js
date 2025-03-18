const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Serve static files
app.use(express.static(__dirname));

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for the authentication page
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Frontend client is running at http://localhost:${PORT}`);
  console.log(`Authentication page available at http://localhost:${PORT}/auth`);
}); 