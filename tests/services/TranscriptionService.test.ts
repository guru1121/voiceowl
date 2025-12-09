import { TranscriptionServiceImpl } from '../../src/services/TranscriptionService';

describe('TranscriptionService', () => {
  let transcriptionService: TranscriptionServiceImpl;

  beforeEach(() => {
    transcriptionService = new TranscriptionServiceImpl();
  });

  describe('mockTranscribe', () => {
    test('should return transcription for valid audio buffer', async () => {
      const audioBuffer = Buffer.from('mock-audio-data');
      
      const result = await transcriptionService.mockTranscribe(audioBuffer);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should return different transcriptions for different buffer sizes', async () => {
      const buffer1 = Buffer.from('a');
      const buffer2 = Buffer.from('ab');
      
      const result1 = await transcriptionService.mockTranscribe(buffer1);
      const result2 = await transcriptionService.mockTranscribe(buffer2);
      
     
      expect(result1).not.toBe(result2);
    });

    test('should simulate processing time', async () => {
      const audioBuffer = Buffer.from('test-audio-data');
      
      const startTime = Date.now();
      await transcriptionService.mockTranscribe(audioBuffer);
      const endTime = Date.now();
      
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(900);
    });

    test('should handle empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      
      const result = await transcriptionService.mockTranscribe(emptyBuffer);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getSupportedLanguages', () => {
    test('should return array of supported languages', () => {
      const languages = transcriptionService.getSupportedLanguages();
      
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages).toContain('en-US');
      expect(languages).toContain('fr-FR');
    });

    test('should return languages in correct format', () => {
      const languages = transcriptionService.getSupportedLanguages();
      
      languages.forEach(lang => {
        expect(lang).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      });
    });
  });

  describe('isAzureAvailable', () => {
    test('should return boolean indicating Azure availability', () => {
      const isAvailable = transcriptionService.isAzureAvailable();
      
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('azureTranscribe', () => {
    test('should handle missing Azure configuration gracefully', async () => {
      const audioBuffer = Buffer.from('test-audio-data');
      
    
      if (!transcriptionService.isAzureAvailable()) {
        await expect(transcriptionService.azureTranscribe(audioBuffer))
          .rejects
          .toMatchObject({
            statusCode: 503,
            code: 'AZURE_NOT_CONFIGURED'
          });
      }
    });

    test('should validate language parameter', async () => {
      const audioBuffer = Buffer.from('test-audio-data');
      const validLanguage = 'en-US';
      
      if (transcriptionService.isAzureAvailable()) {
        
        expect(() => 
          transcriptionService.azureTranscribe(audioBuffer, validLanguage)
        ).not.toThrow();
      }
    });
  });
});