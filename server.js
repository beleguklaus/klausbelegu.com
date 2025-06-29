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
  const weatherIndexPath = path.join(__dirname, 'weather', 'index.html');
  
  try {
    // Check if file exists first
    if (!fs.existsSync(weatherIndexPath)) {
      console.error('Weather index.html not found at:', weatherIndexPath);
      return res.status(404).send('Weather dashboard not found');
    }
    
    const weatherHtml = fs.readFileSync(weatherIndexPath, 'utf8');
    
    // Inject API key into the HTML
    const apiKey = process.env.OPENWEATHER_API_KEY || '';
    const modifiedHtml = weatherHtml.replace(
      '<script src="script.js"></script>',
      `<script>window.WEATHER_API_KEY = '${apiKey}';</script><script src="script.js"></script>`
    );
    
    res.send(modifiedHtml);
  } catch (error) {
    console.error('Error serving weather dashboard:', error);
    res.status(500).send('Error loading weather dashboard');
  }
});

// Debug route to check files and environment
app.get('/debug/files', (req, res) => {
  const fs = require('fs');
  try {
    const files = fs.readdirSync(__dirname);
    const weatherExists = fs.existsSync(path.join(__dirname, 'weather'));
    const weatherFiles = weatherExists ? fs.readdirSync(path.join(__dirname, 'weather')) : [];
    
    res.json({
      currentDir: __dirname,
      rootFiles: files,
      weatherDirExists: weatherExists,
      weatherFiles: weatherFiles,
      envVars: {
        OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY ? 'SET (' + process.env.OPENWEATHER_API_KEY.substring(0, 8) + '...)' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'not set',
        PORT: process.env.PORT || 'not set'
      }
    });
  } catch (error) {
    res.json({ error: error.message, currentDir: __dirname });
  }
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