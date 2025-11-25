const request = require('supertest');
const app = require('../src/server');
const { Video, sequelize } = require('../src/models');
const path = require('path');

describe('Video API Endpoints', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/upload', () => {
    it('should upload a video successfully', async () => {
      const testVideoPath = path.join(__dirname, 'fixtures/test-video.mp4');

      const response = await request(app)
        .post('/api/upload')
        .attach('video', testVideoPath)
        .expect(201);

      expect(response.body).toHaveProperty('video');
      expect(response.body.video).toHaveProperty('id');
      expect(response.body.video).toHaveProperty('thumbnailUrl');
    });

    it('should reject non-video files', async () => {
      const testFilePath = path.join(__dirname, 'fixtures/test-image.jpg');

      await request(app).post('/api/upload').attach('video', testFilePath).expect(400);
    });
  });

  describe('GET /api/videos', () => {
    it('should return list of videos', async () => {
      const response = await request(app).get('/api/videos').expect(200);

      expect(response.body).toHaveProperty('videos');
      expect(Array.isArray(response.body.videos)).toBe(true);
    });
  });

  describe('GET /api/video/:id/stream', () => {
    it('should stream video with range support', async () => {
      // Create test video first
      const video = await Video.create({
        filename: 'test.mp4',
        originalName: 'test.mp4',
        path: path.join(__dirname, 'fixtures/test-video.mp4'),
        size: 1000000,
        mimeType: 'video/mp4'
      });

      const response = await request(app)
        .get(`/api/video/${video.id}/stream`)
        .set('Range', 'bytes=0-1023')
        .expect(206);

      expect(response.headers['content-range']).toBeDefined();
      expect(response.headers['accept-ranges']).toBe('bytes');
    });
  });
});
