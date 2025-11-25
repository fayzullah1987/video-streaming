const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./models');
const videoRoutes = require('./routes/videoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    credentials: true
  })
);
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');

// Rest of your middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendDist));

// Static files for serving thumbnails
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/thumbnails', express.static(path.join(uploadsPath, 'thumbnails')));

// Routes
app.use('/api', videoRoutes);

app.get('*', (req, res) => {
  console.log(__dirname);
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Database sync and server start
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
