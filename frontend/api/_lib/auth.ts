import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const encoder = new TextEncoder();
const secretKey = encoder.encode(JWT_SECRET);

export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
};

export const createToken = async (userId: string, username: string) => {
    return new SignJWT({ sub: userId, username })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .setIssuedAt()
        .sign(secretKey);
};

export const verifyToken = async (token: string) => {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
};
