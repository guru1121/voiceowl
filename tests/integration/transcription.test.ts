import request from 'supertest';
import express from 'express';
import { connectDatabase, clearDatabase, closeDatabase } from '../test-setup';
import transcriptionRoutes from '../../src/routes/transcription';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';

// Mock Azure Speech SDK to prevent real Azure calls in tests
jest.mock('microsoft-cognitiveservices-speech-sdk', () => ({
  SpeechConfig: {
    fromSubscription: jest.fn().mockReturnValue({
      speechRecognitionLanguage: 'en-US'
    })
  },
  SpeechRecognizer: jest.fn().mockImplementation(() => ({
    recognized: null,
    sessionStopped: null,
    canceled: null,
    startContinuousRecognitionAsync: jest.fn((successCb) => {
      // Simulate immediate success
      setTimeout(successCb, 10);
    }),
    stopContinuousRecognitionAsync: jest.fn(),
    close: jest.fn()
  })),
  AudioConfig: {
    fromStreamInput: jest.fn().mockReturnValue({
      close: jest.fn()
    })
  },
  AudioInputStream: {
    createPushStream: jest.fn().mockReturnValue({
      write: jest.fn(),
      close: jest.fn()
    })
  },
  ResultReason: {
    RecognizedSpeech: 1
  },
  CancellationReason: {
    Error: 1
  }
}));

const app = express();

// Setup test app
app.use(express.json());
app.use('/', transcriptionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

describe('Transcription API Integration Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
  }, 35000); // 35 second timeout

  beforeEach(async () => {
    // Ensure clean state before each test
    await clearDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  }, 10000); // 10 second timeout

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        services: {
          database: 'connected'
        },
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /transcription', () => {
    test('should create transcription for valid audio URL', async () => {
      const validRequest = {
        audioUrl: 'https://example.com/sample.mp3'
      };

      const response = await request(app)
        .post('/transcription')
        .send(validRequest)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        message: 'Transcription completed successfully'
      });
    });

    test('should validate required audioUrl field', async () => {
      const invalidRequest = {};

      const response = await request(app)
        .post('/transcription')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    test('should validate audioUrl format', async () => {
      const invalidRequest = {
        audioUrl: 'not-a-valid-url'
      };

      const response = await request(app)
        .post('/transcription')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });

    test('should reject unsupported audio formats', async () => {
      const invalidRequest = {
        audioUrl: 'https://example.com/document.pdf'
      };

      const response = await request(app)
        .post('/transcription')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toMatchObject({
        code: 'UNSUPPORTED_FORMAT'
      });
    });
  });

  describe('POST /azure-transcription', () => {
    test('should create Azure transcription for valid request', async () => {
      const validRequest = {
        audioUrl: 'https://example.com/sample.wav',
        language: 'en-US'
      };

      const response = await request(app)
        .post('/azure-transcription')
        .send(validRequest)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        message: expect.stringContaining('Transcription completed successfully')
      });
    }, 10000);

    test('should use default language when not specified', async () => {
      const validRequest = {
        audioUrl: 'https://example.com/sample.mp4'
      };

      const response = await request(app)
        .post('/azure-transcription')
        .send(validRequest)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String)
      });
    }, 10000);

    test('should validate language format', async () => {
      const invalidRequest = {
        audioUrl: 'https://example.com/sample.wav',
        language: 'invalid-language'
      };

      const response = await request(app)
        .post('/azure-transcription')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('GET /transcriptions', () => {
    test('should return empty array when no transcriptions exist', async () => {
      const response = await request(app)
        .get('/transcriptions')
        .expect(200);

      expect(response.body).toMatchObject({
        transcriptions: [],
        count: 0
      });
    });

    test('should return transcriptions after creating some', async () => {
  
      const createRequest = {
        audioUrl: 'https://example.com/test.mp3'
      };

      await request(app)
        .post('/transcription')
        .send(createRequest)
        .expect(201);

      const response = await request(app)
        .get('/transcriptions')
        .expect(200);

      expect(response.body.transcriptions).toHaveLength(1);
      expect(response.body.count).toBe(1);
      expect(response.body.transcriptions[0]).toMatchObject({
        _id: expect.any(String),
        audioUrl: createRequest.audioUrl,
        transcription: expect.any(String),
        source: 'mock',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    test('should support query parameters for pagination', async () => {
      const response = await request(app)
        .get('/transcriptions?limit=5&offset=0&days=7')
        .expect(200);

      expect(response.body).toMatchObject({
        transcriptions: expect.any(Array),
        count: expect.any(Number)
      });
    });
  });

  describe('GET /transcription/:id', () => {
    test('should return 404 for non-existent transcription', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/transcription/${fakeId}`)
        .expect(404);

      expect(response.body).toMatchObject({
        code: 'TRANSCRIPTION_NOT_FOUND'
      });
    });

    test('should return 400 for invalid ID format', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .get(`/transcription/${invalidId}`)
        .expect(400);

      expect(response.body).toMatchObject({
        code: 'INVALID_ID'
      });
    });

    test('should return transcription by valid ID', async () => {
      // Create a transcription first
      const createRequest = {
        audioUrl: 'https://example.com/test.wav'
      };

      const createResponse = await request(app)
        .post('/transcription')
        .send(createRequest)
        .expect(201);

      const transcriptionId = createResponse.body.id;

      // Fetch the transcription by ID
      const response = await request(app)
        .get(`/transcription/${transcriptionId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        _id: transcriptionId,
        audioUrl: createRequest.audioUrl,
        transcription: expect.any(String),
        source: 'mock',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Route GET /unknown-route not found'),
        code: 'ROUTE_NOT_FOUND'
      });
    });

    test('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/transcription')
        .set('Content-Type', 'application/json')
        .send('invalid-json')
        .expect(400);
    });
  });
});