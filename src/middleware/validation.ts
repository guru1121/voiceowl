import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

interface ValidationSchemas {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}


export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

   
    if (schemas.body) {
      const { error } = schemas.body.validate(req.body);
      if (error) {
        errors.push(`Body validation: ${error.details.map(d => d.message).join(', ')}`);
      }
    }


    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query);
      if (error) {
        errors.push(`Query validation: ${error.details.map(d => d.message).join(', ')}`);
      } else {
       
        (res as any).locals = { ...(res as any).locals, validatedQuery: value };
      }
    }

   
    if (schemas.params) {
      const { error } = schemas.params.validate(req.params);
      if (error) {
        errors.push(`Params validation: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    next();
  };
};