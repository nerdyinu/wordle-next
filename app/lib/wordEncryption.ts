
import crypto from 'crypto';

const chainingMode = 'aes-256-cbc';

// One key and IV per server process, shared by every copy of this module. Turbopack bundles the route handlers
// and the pages separately; with a key per copy, a page couldn't decrypt a link that a route handler made.
const globalWithKeys = global as typeof globalThis & {
  wordEncryptionKeys?: { privateKey: Buffer; ivKey: Buffer };
};
if (!globalWithKeys.wordEncryptionKeys) {
  globalWithKeys.wordEncryptionKeys = { privateKey: crypto.randomBytes(32), ivKey: crypto.randomBytes(16) };
}
const { privateKey, ivKey } = globalWithKeys.wordEncryptionKeys;

export const encrypt = (utf8Text: string): string => {
  const cipher = crypto.createCipheriv(chainingMode, privateKey, ivKey);
  let encrypted = cipher.update(utf8Text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const result = ivKey.toString('hex') + ':' + encrypted;
  return Buffer.from(result).toString('base64');
};

export const decrypt = (encodedText: string): string => {
  const decodedText = Buffer.from(encodedText, 'base64').toString('utf8');
  const [ivHex, encryptedBase64] = decodedText.split(':');
  if (!ivHex || !encryptedBase64) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(chainingMode, privateKey, iv);
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

