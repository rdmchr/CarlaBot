import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

function getJwtSecret() {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not set');
    }
    return JWT_SECRET;
}

export function generateJWT(userId: string) {
    return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
}

export function authenticateJWT(token: string) {
    return jwt.verify(token, getJwtSecret());
}