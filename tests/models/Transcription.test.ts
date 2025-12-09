import { connectDatabase, clearDatabase, closeDatabase } from '../test-setup';
import { Transcription } from '../../src/models/Transcription';

describe('Transcription Model', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Schema Validation', () => {
    test('should create transcription with valid data', async () => {
      const transcriptionData = {
        audioUrl: 'https://example.com/test.mp3',
        transcription: 'This is a test transcription',
        source: 'mock' as const,
        language: 'en-US'
      };

      const transcription = new Transcription(transcriptionData);
      const savedTranscription = await transcription.save();

      expect(savedTranscription._id).toBeDefined();
      expect(savedTranscription.audioUrl).toBe(transcriptionData.audioUrl);
      expect(savedTranscription.transcription).toBe(transcriptionData.transcription);
      expect(savedTranscription.source).toBe(transcriptionData.source);
      expect(savedTranscription.language).toBe(transcriptionData.language);
      expect(savedTranscription.createdAt).toBeDefined();
      expect(savedTranscription.updatedAt).toBeDefined();
    });

    test('should use s for optional fields', async () => {
      const minimalData = {
        audioUrl: 'https://example.com/minimal.wav',
        transcription: 'Minimal transcription'
      };

      const transcription = new Transcription(minimalData);
      const savedTranscription = await transcription.save();

      expect(savedTranscription.source).toBe('mock'); 
      expect(savedTranscription.language).toBe('en-US'); 
    });

    test('should require audioUrl field', async () => {
      const invalidData = {
        transcription: 'Missing audioUrl'
      };

      const transcription = new Transcription(invalidData);
      
      await expect(transcription.save()).rejects.toMatchObject({
        name: 'ValidationError'
      });
    });

    test('should require transcription field', async () => {
      const invalidData = {
        audioUrl: 'https://example.com/test.mp3'
      };

      const transcription = new Transcription(invalidData);
      
      await expect(transcription.save()).rejects.toMatchObject({
        name: 'ValidationError'
      });
    });

    test('should validate source enum values', async () => {
      const invalidData = {
        audioUrl: 'https://example.com/test.mp3',
        transcription: 'Test transcription',
        source: 'invalid-source' as any
      };

      const transcription = new Transcription(invalidData);
      
      await expect(transcription.save()).rejects.toMatchObject({
        name: 'ValidationError'
      });
    });

    test('should validate language format', async () => {
      const invalidData = {
        audioUrl: 'https://example.com/test.mp3',
        transcription: 'Test transcription',
        language: 'invalid-format'
      };

      const transcription = new Transcription(invalidData);
      
      await expect(transcription.save()).rejects.toMatchObject({
        name: 'ValidationError'
      });
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test data
      const now = new Date();
      const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      await Transcription.create([
        {
          audioUrl: 'https://example.com/old.mp3',
          transcription: 'Old transcription',
          source: 'mock',
          createdAt: oldDate
        },
        {
          audioUrl: 'https://example.com/recent1.mp3',
          transcription: 'Recent transcription 1',
          source: 'azure',
          createdAt: recentDate
        },
        {
          audioUrl: 'https://example.com/recent2.mp3',
          transcription: 'Recent transcription 2',
          source: 'mock',
          createdAt: new Date()
        }
      ]);
    });

    test('findRecentTranscriptions should return transcriptions from last 30 days', async () => {
      const recentTranscriptions = await (Transcription as any).findRecentTranscriptions(30, 10, 0);

      expect(recentTranscriptions).toHaveLength(2);
      expect(recentTranscriptions.every((t: any) => t.audioUrl.includes('recent'))).toBe(true);
    });

    test('findRecentTranscriptions should respect limit parameter', async () => {
      const limitedTranscriptions = await (Transcription as any).findRecentTranscriptions(30, 1, 0);

      expect(limitedTranscriptions).toHaveLength(1);
    });

    test('findRecentTranscriptions should respect offset parameter', async () => {
      const offsetTranscriptions = await (Transcription as any).findRecentTranscriptions(30, 10, 1);

      expect(offsetTranscriptions).toHaveLength(1);
    });

    test('findRecentTranscriptions should return results in descending order', async () => {
      const transcriptions = await (Transcription as any).findRecentTranscriptions(30, 10, 0);

      expect(transcriptions).toHaveLength(2);
      
      // Should be ordered by createdAt descending
      const dates = transcriptions.map((t: any) => new Date(t.createdAt));
      expect(dates[0].getTime()).toBeGreaterThanOrEqual(dates[1].getTime());
    });
  });

  describe('Instance Methods', () => {
    test('toResponse should return properly formatted response', async () => {
      const transcriptionData = {
        audioUrl: 'https://example.com/test.mp3',
        transcription: 'Test transcription',
        source: 'azure' as const,
        language: 'fr-FR'
      };

      const transcription = new Transcription(transcriptionData);
      const savedTranscription = await transcription.save();

      const response = savedTranscription.toResponse();

      expect(response).toMatchObject({
        _id: expect.any(String),
        audioUrl: transcriptionData.audioUrl,
        transcription: transcriptionData.transcription,
        source: transcriptionData.source,
        language: transcriptionData.language,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('Indexing', () => {
    test('should create documents efficiently with indexes', async () => {
      // Create multiple documents to test indexing performance
      const documents = Array.from({ length: 100 }, (_, i) => ({
        audioUrl: `https://example.com/test${i}.mp3`,
        transcription: `Test transcription ${i}`,
        source: i % 2 === 0 ? 'mock' as const : 'azure' as const,
        language: 'en-US'
      }));

      const startTime = Date.now();
      await Transcription.insertMany(documents);
      const endTime = Date.now();

     
      expect(endTime - startTime).toBeLessThan(5000); 
      // Verify all document
      const count = await Transcription.countDocuments();
      expect(count).toBe(100);
    });
  });
});