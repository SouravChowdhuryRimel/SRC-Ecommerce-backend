import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';

const RequestValidator = (schema: ZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (err) {
            next(err);
        }
    };
};

export default RequestValidator;