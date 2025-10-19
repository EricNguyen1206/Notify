import { Request, Response, NextFunction } from "express";
import { validate, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToClass(dtoClass, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const errorMessages = errors.map((error: ValidationError) => {
          return Object.values(error.constraints || {}).join(", ");
        });

        res.status(400).json({
          code: 400,
          message: "Validation Error",
          details: errorMessages.join("; "),
        });
        return;
      }

      req.body = dto;
      next();
    } catch (error) {
      res.status(400).json({
        code: 400,
        message: "Validation Error",
        details: "Invalid request data",
      });
    }
  };
};
