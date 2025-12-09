import { Router } from 'express';
import { TranscriptionController } from '../controllers/TranscriptionController';
import { validateRequest } from '../middleware/validation';
import { 
  transcriptionRequestSchema, 
  azureTranscriptionRequestSchema,
  getTranscriptionsQuerySchema 
} from '../types/validation';

const router = Router();
const transcriptionController = new TranscriptionController();

router.get('/health', transcriptionController.healthCheck);

router.post(
  '/transcription',
  validateRequest({ body: transcriptionRequestSchema }),
  transcriptionController.transcribe
);

router.post(
  '/azure-transcription',
  validateRequest({ body: azureTranscriptionRequestSchema }),
  transcriptionController.azureTranscribe
);

router.get(
  '/transcriptions',
  validateRequest({ query: getTranscriptionsQuerySchema }),
  transcriptionController.getTranscriptions
);


router.get('/transcription/:id', transcriptionController.getTranscriptionById);

export default router;