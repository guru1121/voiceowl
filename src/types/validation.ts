import Joi from 'joi';

// Validation schema
export const transcriptionRequestSchema = Joi.object({
  audioUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.uri': 'audioUrl must be a valid HTTP or HTTPS URL',
      'any.required': 'audioUrl is required'
    })
});

export const azureTranscriptionRequestSchema = Joi.object({
  audioUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.uri': 'audioUrl must be a valid HTTP or HTTPS URL',
      'any.required': 'audioUrl is required'
    }),
  language: Joi.string()
    .pattern(/^[a-z]{2}-[A-Z]{2}$/)
    .optional()
    .default('en-US')
    .messages({
      'string.pattern.base': 'language must be in format like en-US, fr-FR'
    })
});

// query parameter validation
export const getTranscriptionsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
  days: Joi.number().integer().min(1).max(365).default(30)
});

// environment variables validation
export const envSchema = Joi.object({
  PORT: Joi.number().port().default(4000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  MONGODB_URI: Joi.string().uri().required(),
  AZURE_SPEECH_KEY: Joi.string().optional(),
  AZURE_SPEECH_REGION: Joi.string().optional(),
  MAX_FILE_SIZE: Joi.string().default('50MB'),
  SUPPORTED_AUDIO_FORMATS: Joi.string().default('mp3,wav,mp4,m4a')
}).unknown(true);