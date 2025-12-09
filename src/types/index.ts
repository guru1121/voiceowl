

export interface TranscriptionRequest {
  audioUrl: string;
}

export interface TranscriptionResponse {
  id: string;
  message?: string;
  error?: string;
}

export interface AzureTranscriptionRequest {
  audioUrl: string;
  language?: string; 
}

export interface AzureTranscriptionResponse {
  id: string;
  message?: string;
  error?: string;
}

export interface GetTranscriptionsResponse {
  transcriptions: TranscriptionDocument[];
  count: number;
}

export interface TranscriptionDocument {
  _id: string;
  audioUrl: string;
  transcription: string;
  source: 'mock' | 'azure';
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Service interfaces
export interface AudioService {
  downloadAudio(url: string): Promise<Buffer>;
  validateAudioUrl(url: string): boolean;
}

export interface TranscriptionService {
  mockTranscribe(audioBuffer: Buffer): Promise<string>;
  azureTranscribe(audioBuffer: Buffer, language?: string): Promise<string>;
}

// Error interfaces
export interface ApiError extends Error {
  statusCode: number;
  code?: string;
}

// Configuration interfaces
export interface AppConfig {
  port: number;
  mongoUri: string;
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
  maxFileSize: string;
  supportedFormats: string[];
}


export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface WorkflowDocument {
  _id: string;
  transcriptionId: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}



export interface TranscriptionEvent {
  type: 'partial' | 'final' | 'error';
  text?: string;
  confidence?: number;
  error?: string;
}