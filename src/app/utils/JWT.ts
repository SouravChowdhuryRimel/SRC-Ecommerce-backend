import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

const generateToken = (payload: object, secret: Secret, expiresIn: string) => {
    // console.log(payload,secret,expiresIn)
    const token = jwt.sign(payload, secret, {
        algorithm: 'HS256',
        expiresIn: expiresIn,
    } as SignOptions);

    return token;
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
    return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
    generateToken,
    verifyToken,
};
export type JwtPayloadType = JwtPayload & {
    email: string;
    role: string;
    iat: number;
    exp: number;
};
export type JwtTokenType = string | JwtPayloadType | null;