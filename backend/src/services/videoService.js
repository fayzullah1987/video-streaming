const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const path = require('path');
const fs = require('fs');

// Configure FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const videoService = {
  // Get video metadata using FFprobe
  getVideoMetadata: (videoPath) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');

        const data = {
          duration: Math.floor(metadata.format.duration),
          resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'unknown',
          bitrate: metadata.format.bit_rate,
          codec: videoStream?.codec_name || 'unknown'
        };

        resolve(data);
      });
    });
  },

  // Generate low-quality thumbnail from video
  generateThumbnail: (videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
      // Use path.dirname and path.basename for cross-platform compatibility
      const folder = path.dirname(outputPath);
      const filename = path.basename(outputPath);

      // Ensure the directory exists
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }

      console.log('Thumbnail folder:', folder);
      console.log('Thumbnail filename:', filename);

      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['10%'],
          filename: filename,
          folder: folder,
          size: '320x180'
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  },

  // Optional: Generate preview clip
  generatePreview: (videoPath, outputPath, duration = 10) => {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime('00:00:00')
        .setDuration(duration)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('640x360')
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .run();
    });
  }
};

module.exports = videoService;
