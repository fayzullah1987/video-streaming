const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const videoController = require('../controllers/videoController');

const router = express.Router();

// Get absolute path to project root (where package.json is)
const getProjectRoot = () => {
  let currentDir = __dirname;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback to parent of src directory
  return path.resolve(__dirname, '..');
};

const projectRoot = getProjectRoot();
const uploadsDir = path.join(projectRoot, 'uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

console.log('Project root:', projectRoot);
console.log('Uploads directory:', uploadsDir);
console.log('Thumbnails directory:', thumbnailsDir);

// Create directories if they don't exist
try {
  if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory...');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(thumbnailsDir)) {
    console.log('Creating thumbnails directory...');
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }
  console.log('✅ Upload directories ready');
} catch (error) {
  console.error('❌ Error creating directories:', error);
  throw error;
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before each upload
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Routes
router.post('/upload', upload.single('video'), videoController.uploadVideo);
router.get('/videos', videoController.listVideos);
router.get('/video/:id/stream', videoController.streamVideo);
router.get('/video/:id/thumbnail', videoController.getThumbnail);
router.delete('/video/:id', videoController.deleteVideo);

// Export both router and paths for use in controller
module.exports = router;
module.exports.uploadsDir = uploadsDir;
module.exports.thumbnailsDir = thumbnailsDir;
