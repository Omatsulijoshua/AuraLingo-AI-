import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// AES-256-GCM encryption helper
export function encrypt(text: string, secretKey: string): string {
  // Ensure key is 32 bytes
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:encryptedData:authTag
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

// AES-256-GCM decryption helper
export function decrypt(cipherText: string, secretKey: string): string {
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid cipher text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');
  
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
