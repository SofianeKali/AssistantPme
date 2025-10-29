import crypto from "crypto";

/**
 * Email password encryption module using AES-256-GCM
 * 
 * SECURITY NOTE: This encrypts email account passwords at rest.
 * The encryption key MUST be stored securely (Replit Secrets).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get or generate encryption key from environment
 * Key is derived from ENCRYPTION_KEY secret using PBKDF2
 */
function getEncryptionKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET;
  
  if (!secret) {
    throw new Error("ENCRYPTION_KEY or SESSION_SECRET must be set in environment variables");
  }
  
  // Derive a 256-bit key using PBKDF2
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, "sha256");
}

/**
 * Encrypt a password using AES-256-GCM
 * Returns base64-encoded string: salt:iv:authTag:encryptedData
 */
export function encryptPassword(password: string): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive encryption key
    const key = getEncryptionKey(salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(password, "utf8"),
      cipher.final(),
    ]);
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine: salt:iv:authTag:encrypted
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
    
    return combined.toString("base64");
  } catch (error) {
    console.error("[Encryption] Error encrypting password:", error);
    throw new Error("Failed to encrypt password");
  }
}

/**
 * Decrypt a password encrypted with encryptPassword
 * Expects base64-encoded string: salt:iv:authTag:encryptedData
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedPassword, "base64");
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    // Derive decryption key
    const key = getEncryptionKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[Encryption] Error decrypting password:", error);
    throw new Error("Failed to decrypt password");
  }
}

/**
 * Check if a password string is encrypted (base64 format)
 * This helps with migration of existing plaintext passwords
 */
export function isEncrypted(password: string): boolean {
  try {
    // Check if it's valid base64
    const decoded = Buffer.from(password, "base64");
    // Check if it has the expected minimum length (salt + iv + authTag + data)
    const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
    return decoded.length >= minLength && password === decoded.toString("base64");
  } catch {
    return false;
  }
}
