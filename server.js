const express = require('express');
const path = require('path');
const app = express();

// Set the port based on environment variable or default to 8080
const PORT = process.env.PORT || 8080;

// Serve static files from root
app.use(express.static(__dirname));

// Weather dashboard route - serve the weather app
app.get('/weather', (req, res) => {
  res.sendFile(path.join(__dirname, 'weather', 'index.html'));
});

// Serve weather static files (CSS, JS, etc.)
app.use('/weather', express.static(path.join(__dirname, 'weather')));

// Route all other requests to main index.html (catch-all for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});