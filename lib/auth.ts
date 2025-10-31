import { SignJWT, jwtVerify } from "jose";
import * as bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

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
 * Verify admin password (simple password check for now)
 * In production, this should check against a hashed password in database
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log("🔐 Admin login attempt");
  console.log("Password received:", password ? `[${password.length} chars]` : "empty");
  console.log("ADMIN_PASSWORD set:", adminPassword ? `[${adminPassword.length} chars]` : "NOT SET");

  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD not set in environment variables");
    return false;
  }

  const isValid = password === adminPassword;
  console.log("Password match:", isValid);

  return isValid;
}
