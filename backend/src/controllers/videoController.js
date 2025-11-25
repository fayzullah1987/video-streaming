const fs = require('fs');
const path = require('path');
const { Video } = require('../models/Video');
const videoService = require('../services/videoService');

/* -------------------------------------------
   Find Project Root (where package.json lives)
-------------------------------------------- */
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

/* -------------------------------------------
   Video Controller
-------------------------------------------- */
const videoController = {
  /* -------------------------------------------
     Upload Video + Generate Thumbnail
  -------------------------------------------- */
  uploadVideo: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video provided' });
      }

      const videoPath = req.file.path;
      const filename = req.file.filename;

      const metadata = await videoService.getVideoMetadata(videoPath);

      // Ensure thumbnails folder exists
      fs.mkdirSync(thumbnailsDir, { recursive: true });

      const thumbnailFilename = filename.replace(/\.[^/.]+$/, '.jpg');
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

      await videoService.generateThumbnail(videoPath, thumbnailPath);

      // Save to MongoDB
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

      return res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: video._id,
          filename: video.originalName,
          size: video.size,
          duration: video.duration,
          resolution: video.resolution,
          createdAt: video.createdAt,
          thumbnailUrl: `/api/video/${video._id}/thumbnail`,
          streamUrl: `/api/video/${video._id}/stream`
        }
      });
    } catch (error) {
      console.error('Upload Error:', error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Upload failed', details: error.message });
    }
  },

  /* -------------------------------------------
     List All Videos
  -------------------------------------------- */
  listVideos: async (req, res) => {
    try {
      const videos = await Video.find().sort({ createdAt: -1 });

      return res.json({
        videos: videos.map((v) => ({
          id: v._id,
          filename: v.originalName,
          size: v.size,
          duration: v.duration,
          resolution: v.resolution,
          createdAt: v.createdAt,
          thumbnailUrl: `/api/video/${v._id}/thumbnail`,
          streamUrl: `/api/video/${v._id}/stream`
        }))
      });
    } catch (error) {
      console.error('List error:', error);
      return res.status(500).json({ error: 'Failed to load videos' });
    }
  },

  /* -------------------------------------------
     Stream Video (Chunked)
  -------------------------------------------- */
  streamVideo: async (req, res) => {
    try {
      const { id } = req.params;
      const video = await Video.findById(id);

      if (!video) return res.status(404).json({ error: 'Video not found' });

      if (!fs.existsSync(video.path)) {
        return res.status(404).json({ error: 'Video file missing' });
      }

      const stat = fs.statSync(video.path);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (!range) {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': video.mimeType
        });
        return fs.createReadStream(video.path).pipe(res);
      }

      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType
      });

      fs.createReadStream(video.path, { start, end }).pipe(res);
    } catch (error) {
      console.error('Stream error:', error);
      return res.status(500).json({ error: 'Stream failed' });
    }
  },

  /* -------------------------------------------
     Serve Thumbnail
  -------------------------------------------- */
  getThumbnail: async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video || !video.thumbnailPath)
        return res.status(404).json({ error: 'Thumbnail not found' });

      if (!fs.existsSync(video.thumbnailPath))
        return res.status(404).json({ error: 'Thumbnail file missing' });

      return res.sendFile(path.resolve(video.thumbnailPath));
    } catch (error) {
      console.error('Thumbnail error:', error);
      return res.status(500).json({ error: 'Failed to load thumbnail' });
    }
  },

  /* -------------------------------------------
     Delete Video
  -------------------------------------------- */
  deleteVideo: async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);
      if (!video) return res.status(404).json({ error: 'Video not found' });

      if (fs.existsSync(video.path)) fs.unlinkSync(video.path);
      if (video.thumbnailPath && fs.existsSync(video.thumbnailPath))
        fs.unlinkSync(video.thumbnailPath);

      await Video.deleteOne({ _id: video._id });

      return res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete video' });
    }
  }
};

module.exports = videoController;
