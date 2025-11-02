export class AppError extends Error {
    public statusCode: number;
    constructor(message: string, statusCode: number, stack = '') {
        super(message);
        this.statusCode = statusCode;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}