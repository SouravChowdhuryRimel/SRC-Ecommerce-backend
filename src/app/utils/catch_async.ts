import { RequestHandler, Request, Response, NextFunction } from 'express';

const catchAsync = (fn: RequestHandler): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

export default catchAsync;