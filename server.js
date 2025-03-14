const express = require('express');
const path = require('path');
const app = express();

// Set the port based on environment variable or default to 8080
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(__dirname));

// Route all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});