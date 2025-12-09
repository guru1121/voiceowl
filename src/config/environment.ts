import dotenv from 'dotenv';
import { envSchema } from '../types/validation';
import { AppConfig } from '../types';

dotenv.config();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config: AppConfig = {
  port: envVars.PORT,
  mongoUri: envVars.MONGODB_URI,
  azureSpeechKey: envVars.AZURE_SPEECH_KEY,
  azureSpeechRegion: envVars.AZURE_SPEECH_REGION,
  maxFileSize: envVars.MAX_FILE_SIZE,
  supportedFormats: envVars.SUPPORTED_AUDIO_FORMATS.split(',').map((format: string) => format.trim())
};

export const isAzureConfigured = (): boolean => {
  return !!(config.azureSpeechKey && config.azureSpeechRegion);
};

export const isDevelopment = (): boolean => envVars.NODE_ENV === 'development';
export const isProduction = (): boolean => envVars.NODE_ENV === 'production';
export const isTest = (): boolean => envVars.NODE_ENV === 'test';