import { AudioServiceImpl } from '../../src/services/AudioService';

describe('AudioService', () => {
  let audioService: AudioServiceImpl;

  beforeEach(() => {
    audioService = new AudioServiceImpl();
  });

  describe('validateAudioUrl', () => {
    test('should validate correct audio URLs', () => {
      const validUrls = [
        'https://example.com/audio.mp3',
        'http://test.com/sample.wav',
        'https://cdn.example.com/music.mp4',
        'https://storage.com/voice.m4a'
      ];

      validUrls.forEach(url => {
        expect(audioService.validateAudioUrl(url)).toBe(true);
      });
    });

    test('should reject invalid audio URLs', () => {
      const invalidUrls = [
        'https://example.com/document.pdf',
        'http://test.com/image.jpg',
        'invalid-url',
        'ftp://example.com/audio.mp3',
        'https://example.com/audio.txt'
      ];

      invalidUrls.forEach(url => {
        expect(audioService.validateAudioUrl(url)).toBe(false);
      });
    });

    test('should handle malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'https://.',
        ''
      ];

      malformedUrls.forEach(url => {
        expect(audioService.validateAudioUrl(url)).toBe(false);
      });
    });
  });

  describe('mockDownloadAudio', () => {
    test('should successfully mock download valid audio URL', async () => {
      const validUrl = 'https://example.com/test.mp3';
      
      const buffer = await audioService.mockDownloadAudio(validUrl);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    test('should reject unsupported audio format', async () => {
      const invalidUrl = 'https://example.com/document.pdf';
      
      await expect(audioService.mockDownloadAudio(invalidUrl))
        .rejects
        .toMatchObject({
          statusCode: 400,
          code: 'UNSUPPORTED_FORMAT'
        });
    });

    test('should simulate processing delay', async () => {
      const validUrl = 'https://example.com/test.wav';
      
      const startTime = Date.now();
      await audioService.mockDownloadAudio(validUrl);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(400);
    });
  });
});