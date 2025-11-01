import { SignJWT, jwtVerify } from "jose";
import * as bcrypt from "bcryptjs";

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is not set. " +
      "Application cannot start without a secure JWT secret."
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "FATAL: JWT_SECRET must be at least 32 characters long for security."
    );
  }

  return new TextEncoder().encode(secret);
})();

const JWT_ALGORITHM = "HS256";
const JWT_EXPIRATION = "8h"; // 8 hours

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token
 */
export async function createJWT(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Validate that payload has required fields
    if (
      payload &&
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };
    }

    return null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Verify admin password using bcrypt
 * Compares provided password against hashed password from environment
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminPasswordHash) {
    if (process.env.NODE_ENV === 'development') {
      console.error("ADMIN_PASSWORD_HASH not set in environment variables");
    }
    return false;
  }

  try {
    // Use bcrypt to securely compare password with hash
    const isValid = bcrypt.compareSync(password, adminPasswordHash);

    if (process.env.NODE_ENV === 'development') {
      console.log("Admin login attempt:", isValid ? "successful" : "failed");
    }

    return isValid;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error verifying admin password:", error);
    }
    return false;
  }
}
