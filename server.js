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

// API proxy for weather data - keeps API key secure
app.get('/api/weather/current/:city', async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    const city = req.params.city;
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/api/weather/forecast/:city', async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    const city = req.params.city;
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

app.get('/api/weather/coords', async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    const { lat, lon } = req.query;
    const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    
    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    
    res.json({ current: currentData, forecast: forecastData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
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