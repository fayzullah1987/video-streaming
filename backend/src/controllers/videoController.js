const fs = require('fs');
const path = require('path');
const { Video } = require('../models/Video');
const videoService = require('../services/videoService');

// Helper function to get project root
const getProjectRoot = () => {
  let currentDir = __dirname;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return path.resolve(__dirname, '../..');
};

const projectRoot = getProjectRoot();
const thumbnailsDir = path.join(projectRoot, 'uploads', 'thumbnails');

const videoController = {
  // Upload video + generate thumbnail
  uploadVideo: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
      }

      const videoPath = req.file.path;
      const filename = req.file.filename;

      // FFmpeg metadata
      const metadata = await videoService.getVideoMetadata(videoPath);

      // Ensure thumbnail folder exists
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }

      const thumbnailFilename = filename.replace(/\.[^/.]+$/, '.jpg');
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

      await videoService.generateThumbnail(videoPath, thumbnailPath);

      // Save in MongoDB
      const video = await Video.create({
        filename,
        originalName: req.file.originalname,
        path: videoPath,
        thumbnailPath,
        size: req.file.size,
        duration: metadata.duration,
        mimeType: req.file.mimetype,
        resolution: metadata.resolution
      });

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: video._id,
          filename: video.originalName,
          size: video.size,
          duration: video.duration,
          resolution: video.resolution,
          thumbnailUrl: `/api/video/${video._id}/thumbnail`,
          streamUrl: `/api/video/${video._id}/stream`
        }
      });
    } catch (error) {
      console.error('Upload error:', error);

      // Delete orphan file if db save failed
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: 'Failed to upload video',
        details: error.message
      });
    }
  },

  // List videos
  listVideos: async (req, res) => {
    try {
      const videos = await Video.find().sort({ createdAt: -1 });

      const formattedVideos = videos.map((video) => ({
        id: video._id,
        filename: video.originalName,
        size: video.size,
        duration: video.duration,
        resolution: video.resolution,
        createdAt: video.createdAt,
        thumbnailUrl: `/api/video/${video._id}/thumbnail`,
        streamUrl: `/api/video/${video._id}/stream`
      }));

      res.json({ videos: formattedVideos });
    } catch (error) {
      console.error('List error:', error);
      res.status(500).json({
        error: 'Failed to retrieve videos',
        details: error.message
      });
    }
  },

  // Stream video
  streamVideo: async (req, res) => {
    try {
      const { id } = req.params;
      const video = await Video.findById(id);

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const videoPath = video.path;

      if (!fs.existsSync(videoPath)) {
        console.error('Video file missing:', videoPath);
        return res.status(404).json({ error: 'Video file not found' });
      }

      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const stream = fs.createReadStream(videoPath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': video.mimeType
        });

        stream.pipe(res);

        stream.on('error', (err) => {
          console.error('Stream error:', err);
          if (!res.headersSent) res.status(500).end();
        });
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': video.mimeType
        });

        const stream = fs.createReadStream(videoPath);
        stream.pipe(res);

        stream.on('error', (err) => {
          console.error('Stream error:', err);
          if (!res.headersSent) res.status(500).end();
        });
      }
    } catch (error) {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Stream failed',
          details: error.message
        });
      }
    }
  },

  // Get Thumbnail
  getThumbnail: async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video || !video.thumbnailPath) {
        return res.status(404).json({ error: 'Thumbnail not found' });
      }

      if (!fs.existsSync(video.thumbnailPath)) {
        return res.status(404).json({ error: 'Thumbnail file missing' });
      }

      res.setHeader('Content-Type', 'image/jpeg');
      res.sendFile(path.resolve(video.thumbnailPath));
    } catch (error) {
      console.error('Thumbnail error:', error);
      res.status(500).json({
        error: 'Failed to load thumbnail',
        details: error.message
      });
    }
  },

  // Delete video
  deleteVideo: async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      if (fs.existsSync(video.path)) {
        fs.unlinkSync(video.path);
      }

      if (video.thumbnailPath && fs.existsSync(video.thumbnailPath)) {
        fs.unlinkSync(video.thumbnailPath);
      }

      await video.remove();

      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        error: 'Failed to delete video',
        details: error.message
      });
    }
  }
};

module.exports = videoController;
