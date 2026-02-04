import * as crypto from 'crypto';
import canonicalize from 'canonicalize';

export class CryptoHelper {
  /**
   * Constant
   */
  static SIGN_ALGORITHM = 'HMAC-SHA256';
  static HASH_ALGORITHM = 'sha256';

  static generateClientId(userId: number): string {
    const uuidv4 = crypto.randomUUID();
    return `${userId}-${uuidv4}`;
  }

  /**
   * Shared Secret Key Generation
   */
  static generatedSharedSecretKey(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('base64');
  }

  /**
   * Create canonical JSON string (stable order)
   * RFC8785 Standart
   */
  static canonicalizeBody(body: unknown): string {
    if (!body || Object.keys(body as object).length === 0) {
      return '';
    }
    return canonicalize(body) || '';
  }

  /**
   * Hash request body using SHA-256
   */
  static hashBody(body: unknown): string {
    const canonical = this.canonicalizeBody(body);
    return crypto
      .createHash(this.HASH_ALGORITHM)
      .update(canonical)
      .digest('hex')
      .toLowerCase();
  }

  /**
   * String to Sign for Merchant Signature
   */
  static buildStringToSign(params: {
    method: string;
    path: string;
    timestamp: string;
    nonce: string;
    body: unknown;
  }): string {
    const bodyHash = this.hashBody(params.body);
    return [
      params.method.toUpperCase(),
      params.path,
      params.timestamp,
      params.nonce,
      bodyHash,
    ].join('\n');
  }

  /**
   * Sign Canonical String using Merchant Secret Key
   */
  static sign(secretKeyBase64: string, stringToSign: string): string {
    return crypto
      .createHmac(this.HASH_ALGORITHM, Buffer.from(secretKeyBase64, 'base64'))
      .update(stringToSign, 'utf-8')
      .digest('hex');
  }

  /**
   * Verify HMAC signature (timing safe)
   */
  static verifySignature(
    secretKeyBase64: string,
    stringToSign: string,
    receivedSignature: string,
  ): boolean {
    if (!/^[0-9a-f]+$/i.test(receivedSignature)) {
      return false;
    }

    const expected = this.sign(secretKeyBase64, stringToSign);

    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(receivedSignature, 'hex'),
    );
  }

  /**
   * Validate request timestamp (anti-replay)
   * Default tolerance: 10 minutes
   */
  static isTimestampValid(timestamp: string, toleranceSeconds = 7200): boolean {
    const requestTime = new Date(timestamp).getTime();
    if (isNaN(requestTime)) return false;

    const now = Date.now();
    const diffSeconds = Math.abs(now - requestTime) / 1000;

    return diffSeconds <= toleranceSeconds;
  }

  /**
   * Generate nonce (UUID vs style)
   */
  static generateNonce(): string {
    return crypto.randomUUID();
  }
}
