// utils/crypto.helper.ts
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || '25167358022485872541250266442180',
  'utf-8',
); // must be 32 bytes

export class CryptoHelper {
  /**
   * Generate random private key for merchant
   */
  static generatePrivateKey(length = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Encrypt text using AES-256-GCM
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt text using AES-256-GCM
   */
  static decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create HMAC SHA-256 signature
   * @param privateKey raw private key
   * @param payload object or string to sign
   */
  static sign(privateKey: string, payload: object | string): string {
    const payloadString =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    return crypto
      .createHmac('sha256', privateKey)
      .update(payloadString, 'utf8')
      .digest('hex');
  }

  /**
   * Verify HMAC SHA-256 signature
   * @param privateKey raw private key
   * @param payload object or string that was signed
   * @param signature signature from merchant
   */
  static verify(
    privateKey: string,
    payload: object | string,
    signature: string,
  ): boolean {
    const expectedSignature = this.sign(privateKey, payload);
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  }
}
