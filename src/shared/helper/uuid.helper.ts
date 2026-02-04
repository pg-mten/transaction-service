import { randomBytes } from 'crypto';
import { v4 as uuidv4, v7 as uuidv7 } from 'uuid';

/**
 * Utility for generating unique random identifiers.
 * Used for correlation IDs, request tracking, auditing, etc.
 */
export class UuidHelper {
  /**
   * Generate a standard UUID v4.
   * Example: "3f0a0ad8-7f25-4b16-92ed-0d08f1f8e08e"
   */
  static v4(): string {
    return uuidv4();
  }

  /**
   * Generate a random hex string of given length.
   * Example: "a3b1f02d7e8c9d3a" (for length = 8 bytes)
   *
   * @param length Number of bytes (default = 16 → 32 hex chars)
   */
  static hex(length = 16): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Generate a short unique identifier (e.g. for log correlation or tracing).
   * Example: "REQ-3f0a0ad87f254b16"
   */
  static requestId(prefix = 'REQ'): string {
    return `${prefix}-${randomBytes(8).toString('hex')}`;
  }

  /**
   * Cryptographic Random for Code Transaction
   */
  static generateRandomCode(): string {
    return randomBytes(6).toString('hex');
  }

  /**
   * UUID v7 for Order ID (time-ordered)
   * @returns
   */
  static generateOrderId(): string {
    return uuidv7();
  }
}
