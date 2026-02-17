
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Fix: Cast res to any to avoid "Property does not exist" errors on Express Response type
  const response = res as any;
  const statusCode = response.statusCode === 200 ? 500 : response.statusCode;
  response.status(statusCode);
  response.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
