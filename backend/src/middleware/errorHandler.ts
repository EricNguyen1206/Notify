import { Request, Response, NextFunction } from "express";
import { logger } from "@/utils/logger";
import { ErrorResponse } from "@/types/response/auth.response";

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Default error response
  let statusCode = 500;
  let message = "Internal Server Error";
  let details: string | undefined;

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    details = error.message;
  } else if (error.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Unauthorized";
    details = "Invalid or missing authentication token";
  } else if (error.name === "ForbiddenError") {
    statusCode = 403;
    message = "Forbidden";
    details = "Insufficient permissions";
  } else if (error.name === "NotFoundError") {
    statusCode = 404;
    message = "Not Found";
    details = error.message;
  } else if (error.name === "ConflictError") {
    statusCode = 409;
    message = "Conflict";
    details = error.message;
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  }

  const errorResponse: ErrorResponse = {
    code: statusCode,
    message,
    details,
  };

  res.status(statusCode).json(errorResponse);
};
