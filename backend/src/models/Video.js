const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    thumbnailPath: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      default: null
    },
    mimeType: {
      type: String,
      required: true
    },
    resolution: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'videos'
  }
);

const Video = mongoose.model('Video', videoSchema);

module.exports = { Video };
