import { Request, Response } from 'express';
import { Transcription } from '../models/Transcription';
import { AudioServiceImpl } from '../services/AudioService';
import { TranscriptionServiceImpl } from '../services/TranscriptionService';
import { 
  TranscriptionRequest, 
  TranscriptionResponse,
  AzureTranscriptionRequest,
  AzureTranscriptionResponse,
  GetTranscriptionsResponse,
  ApiError 
} from '../types';

export class TranscriptionController {
  private audioService: AudioServiceImpl;
  private transcriptionService: TranscriptionServiceImpl;

  constructor() {
    this.audioService = new AudioServiceImpl();
    this.transcriptionService = new TranscriptionServiceImpl();
  }

  // POST /transcription
   
  public transcribe = async (req: Request, res: Response): Promise<void> => {
    try {
      const { audioUrl }: TranscriptionRequest = req.body;

      console.log(`Processing transcription request for: ${audioUrl}`);

      const audioBuffer = await this.audioService.mockDownloadAudio(audioUrl);

     
      const transcriptionText = await this.transcriptionService.mockTranscribe(audioBuffer);

      // Save to MongoDB
      const transcriptionDoc = new Transcription({
        audioUrl,
        transcription: transcriptionText,
        source: 'mock'
      });

      const savedDoc = await transcriptionDoc.save();

      console.log(`Transcription saved with ID: ${savedDoc._id}`);

      const response: TranscriptionResponse = {
        id: savedDoc._id.toString(),
        message: 'Transcription completed successfully'
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('something wrong Transcription error:', error);
      this.handleError(error, res);
    }
  };

  // POST /azure-transcription  
  
  public azureTranscribe = async (req: Request, res: Response): Promise<void> => {
    try {
      const { audioUrl, language = 'en-US' }: AzureTranscriptionRequest = req.body;

      console.log(` Processing Azure transcription request for: ${audioUrl} (${language})`);

      // Check if language is supported
      if (!this.transcriptionService.getSupportedLanguages().includes(language)) {
        throw this.createError(
          `Unsupported language: ${language}. Supported languages: ${this.transcriptionService.getSupportedLanguages().join(', ')}`,
          400,
          'UNSUPPORTED_LANGUAGE'
        );
      }

      let transcriptionText: string;
      let source: 'azure' | 'mock' = 'azure';

      // Download audio file
      const audioBuffer = await this.audioService.mockDownloadAudio(audioUrl);

  
      if (this.transcriptionService.isAzureAvailable()) {
        try {
          transcriptionText = await this.transcriptionService.azureTranscribe(audioBuffer, language);
        } catch (azureError) {
          console.warn('Azure transcription failed, falling back to mock:', azureError);
          transcriptionText = await this.transcriptionService.mockTranscribe(audioBuffer);
          source = 'mock';
        }
      } else {
        console.log('Azure not configured, using mock transcription');
        transcriptionText = await this.transcriptionService.mockTranscribe(audioBuffer);
        source = 'mock';
      }

      // Save to MongoDB
      const transcriptionDoc = new Transcription({
        audioUrl,
        transcription: transcriptionText,
        source,
        language
      });

      const savedDoc = await transcriptionDoc.save();

      console.log(`Azure transcription saved with ID: ${savedDoc._id}`);

      const response: AzureTranscriptionResponse = {
        id: savedDoc._id.toString(),
        message: `Transcription completed successfully using ${source} service`
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('something wrong Azure transcription error:', error);
      this.handleError(error, res);
    }
  };

 // GET /transcriptions (30 days)
  
  public getTranscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
   
      const validatedQuery = (res as any).locals?.validatedQuery || req.query;
      const days = parseInt(validatedQuery.days as string) || 30;
      const limit = parseInt(validatedQuery.limit as string) || 10;
      const offset = parseInt(validatedQuery.offset as string) || 0;

      console.log(` Fetching transcriptions from last ${days} days (limit: ${limit}, offset: ${offset})`);

      // Use the static method we defined in the model
      const transcriptions = await (Transcription as any).findRecentTranscriptions(days, limit, offset);

      const response: GetTranscriptionsResponse = {
        transcriptions: transcriptions.map((doc: any) => ({
          _id: doc._id.toString(),
          audioUrl: doc.audioUrl,
          transcription: doc.transcription,
          source: doc.source,
          language: doc.language,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        })),
        count: transcriptions.length
      };

      console.log(`Retrieved ${transcriptions.length} transcriptions`);

      res.status(200).json(response);

    } catch (error) {
      console.error('something wrong Get transcriptions error:', error);
      this.handleError(error, res);
    }
  };

 // GET /transcription/:id
  
  public getTranscriptionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      console.log(` Fetching transcription with ID: ${id}`);

      const transcription = await Transcription.findById(id).lean();

      if (!transcription) {
        throw this.createError(
          `Transcription not found with ID: ${id}`,
          404,
          'TRANSCRIPTION_NOT_FOUND'
        );
      }

      const response = {
        _id: transcription._id.toString(),
        audioUrl: transcription.audioUrl,
        transcription: transcription.transcription,
        source: transcription.source,
        language: transcription.language,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('something wrong Get transcription by ID error:', error);
      this.handleError(error, res);
    }
  };

  // GET /health
  
  public healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          azure: this.transcriptionService.isAzureAvailable() ? 'configured' : 'not configured'
        },
        version: '1.0.0'
      };

      res.status(200).json(health);

    } catch (error) {
      console.error('something wrong Health check error:', error);
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as ApiError;
      res.status(apiError.statusCode).json({
        error: apiError.message,
        code: apiError.code || 'UNKNOWN_ERROR'
      });
    } else if (error instanceof Error) {
      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      } else if (error.name === 'CastError') {
        res.status(400).json({
          error: 'Invalid ID format',
          code: 'INVALID_ID'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
          code: 'INTERNAL_ERROR'
        });
      }
    } else {
      res.status(500).json({
        error: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR'
      });
    }
  }

  private createError(message: string, statusCode: number, code?: string): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    error.code = code;
    return error;
  }
}