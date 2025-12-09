import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

//Global error handling middleware

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled error:', error);

  if (res.headersSent) {
    return next(error);
  }

  // Handle custom API errors
  if ('statusCode' in error) {
    const apiError = error as ApiError;
    res.status(apiError.statusCode).json({
      error: apiError.message,
      code: apiError.code || 'API_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack })
    });
    return;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation failed',
      details: error.message,
      code: 'VALIDATION_ERROR'
    });
    return;
  }

  if (error.name === 'CastError') {
    res.status(400).json({
      error: 'Invalid ID format',
      code: 'INVALID_ID'
    });
    return;
  }

  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    res.status(500).json({
      error: 'Database error',
      code: 'DATABASE_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
    return;
  }

  //  internal server error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      message: error.message,
      stack: error.stack 
    })
  });
};

// 404 handler for unknown routes
 
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

// Request logging middleware

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  

  console.log(`something wrong ${req.method} ${req.path} - ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status < 400 ? '' : status < 500 ? '⚠️' : 'something wrong';
    
    console.log(`${statusColor} ${req.method} ${req.path} - ${status} - ${duration}ms`);
  });

  next();
};