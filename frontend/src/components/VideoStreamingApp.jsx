import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Clock, HardDrive, Trash2, AlertCircle } from 'lucide-react';

// API Configuration

function VideoStreamingApp() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/videos');

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load videos. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError('File size must be less than 500MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          console.log('Upload successful:', response);

          // Refresh video list
          fetchVideos();

          // Reset form
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          throw new Error('Upload failed');
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload');
      });

      xhr.addEventListener('loadend', () => {
        setUploading(false);
        setUploadProgress(0);
      });

      // Send request
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  const handleDelete = async (videoId, e) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const response = await fetch(`/api/video/${videoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      // Remove from list
      setVideos(videos.filter((v) => v.id !== videoId));

      // Close player if deleted video is currently playing
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete video: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">VideoStream</h1>
          </div>
          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Upload size={20} />
            <span>{uploading ? 'Uploading...' : 'Upload Video'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-4">
          <div className="bg-red-900 border border-red-700 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-200 hover:text-white">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="max-w-7xl mx-auto mt-4 px-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Uploading video...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Processing video and generating thumbnail...
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Video Grid */}
      {!loading && (
        <main className="max-w-7xl mx-auto p-4">
          <h2 className="text-xl font-semibold mb-4">Your Videos ({videos.length})</h2>

          {videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group"
                >
                  <div
                    className="relative aspect-video bg-gray-700 cursor-pointer"
                    onClick={() => handleVideoClick(video)}
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%23444" width="320" height="180"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3ENo Thumbnail%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 transition-opacity">
                      <Play size={48} className="text-white" />
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium truncate mb-2" title={video.filename}>
                      {video.filename}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        {video.duration && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDuration(video.duration)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <HardDrive size={12} />
                          {formatSize(video.size)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDelete(video.id, e)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete video"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {video.resolution && (
                      <p className="text-xs text-gray-500 mt-1">{video.resolution}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Upload size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No videos yet. Upload your first video!</p>
              <p className="text-sm mt-2">Supported formats: MP4, WebM, AVI, MOV</p>
            </div>
          )}
        </main>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={handleClosePlayer}
        >
          <div
            className="max-w-5xl w-full bg-gray-800 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black relative">
              <video
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="w-full h-full"
                onLoadStart={(e) => {
                  console.log('🎬 Video load started');
                  console.log('Video URL:', e.target.src);
                }}
                onLoadedMetadata={(e) => {
                  console.log('✅ Video metadata loaded');
                  console.log('Duration:', e.target.duration);
                }}
                onLoadedData={() => {
                  console.log('✅ Video data loaded');
                }}
                onCanPlay={() => {
                  console.log('✅ Video can play');
                }}
                onError={(e) => {
                  console.error('❌ Video playback error');
                  console.error('Video source:', e.target.src);
                  console.error('Error object:', e.target.error);
                  console.error('Network state:', e.target.networkState);
                  console.error('Ready state:', e.target.readyState);

                  if (e.target.error) {
                    console.error('Error code:', e.target.error.code);
                    console.error('Error message:', e.target.error.message);

                    const errorMessages = {
                      1: 'MEDIA_ERR_ABORTED - Video loading was aborted',
                      2: 'MEDIA_ERR_NETWORK - Network error while fetching video',
                      3: 'MEDIA_ERR_DECODE - Video is corrupted or unsupported format',
                      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Video format not supported by browser'
                    };

                    const errorMsg = errorMessages[e.target.error.code] || 'Unknown video error';
                    console.error('Detailed error:', errorMsg);
                    setError(errorMsg + ' - Try uploading an MP4 file');
                  }
                }}
              >
                <source
                  src={selectedVideo.streamUrl}
                  type={selectedVideo.mimeType || 'video/mp4'}
                />
                Your browser does not support video playback.
              </video>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">{selectedVideo.filename}</h2>
                  <div className="flex gap-4 text-sm text-gray-400">
                    {selectedVideo.duration && (
                      <span>Duration: {formatDuration(selectedVideo.duration)}</span>
                    )}
                    <span>Size: {formatSize(selectedVideo.size)}</span>
                    {selectedVideo.resolution && <span>Quality: {selectedVideo.resolution}</span>}
                  </div>
                  {selectedVideo.createdAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded: {new Date(selectedVideo.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClosePlayer}
                  className="text-gray-400 hover:text-white text-3xl leading-none ml-4"
                  title="Close player"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="max-w-7xl mx-auto p-4 mt-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="bg-gray-900 p-4 rounded">
            <p className="font-semibold text-white mb-2">Key Features:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>✅ Real-time upload progress tracking</li>
              <li>✅ Automatic thumbnail loading from backend</li>
              <li>✅ Chunked video streaming with HTTP Range Requests</li>
              <li>✅ Video seeking and instant playback</li>
              <li>✅ Delete functionality with confirmation</li>
              <li>✅ Error handling and user feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoStreamingApp;
