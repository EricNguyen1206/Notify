import { Request, Response } from "express";
import { ErrorResponse } from "@notify/types";

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    code: 404,
    message: "Not Found",
    details: `Route ${req.method} ${req.path} not found`,
  };

  res.status(404).json(errorResponse);
};
