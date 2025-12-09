import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/environment';
import { database } from './config/database';
import transcriptionRoutes from './routes/transcription';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ 
        message: "VoiceOwl Audio Transcription API",
        version: "1.0.0",
        endpoints: [
            "POST /transcription - Mock audio transcription",
            "POST /azure-transcription - Azure Speech-to-Text transcription",
            "GET /transcriptions - Get recent transcriptions", 
            "GET /transcription/:id - Get specific transcription",
            "GET /health - Health check"
        ]
    });
});


app.use('/', transcriptionRoutes);

// error handling
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
    try {
       
        await database.connect();
        
        app.listen(config.port, () => {
            console.log(`server running at http://localhost:${config.port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database: ${database.isHealthy() ? 'Connected' : 'Disconnected'}`);
        });
        
    } catch (error) {
        console.error('something wrong Failed to start server:', error);
        process.exit(1);
    }
}

// shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    
    try {
        await database.disconnect();
        console.log('Server shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('something wrong Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    
    try {
        await database.disconnect();
        console.log('Server shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('something wrong Error during shutdown:', error);
        process.exit(1);
    }
});

startServer();