const express = require('express');
const path = require('path');
const app = express();

// Set the port based on environment variable or default to 8080
const PORT = process.env.PORT || 8080;

// Serve static files from root
app.use(express.static(__dirname));

// Weather dashboard route - serve the weather app with API key injection
app.get('/weather', (req, res) => {
  const fs = require('fs');
  const weatherHtml = fs.readFileSync(path.join(__dirname, 'weather', 'index.html'), 'utf8');
  
  // Inject API key into the HTML
  const apiKey = process.env.OPENWEATHER_API_KEY || '';
  const modifiedHtml = weatherHtml.replace(
    '<script src="script.js"></script>',
    `<script>window.WEATHER_API_KEY = '${apiKey}';</script><script src="script.js"></script>`
  );
  
  res.send(modifiedHtml);
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