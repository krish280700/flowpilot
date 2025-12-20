import bcrypt from "bcryptjs";

/**
 * Hash password with bcrypt
 * Takes plain text password → returns hashed version
 * Example: "password123" → "$2a$10$..."
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;  // Higher = more secure but slower
    return bcrypt.hash(password, saltRounds);
}

/**
 * Compare plain password with hash
 * Used during login to verify password
 * Example: compare("password123", "$2a$10$...") → true/false
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}