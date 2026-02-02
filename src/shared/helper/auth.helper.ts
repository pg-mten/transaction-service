import * as argon2 from 'argon2';

export class AuthHelper {
  static hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  static verifyPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return argon2.verify(hashedPassword, plainPassword);
  }
}
