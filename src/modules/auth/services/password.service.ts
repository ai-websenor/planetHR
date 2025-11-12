import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class PasswordService {
  private readonly BCRYPT_ROUNDS = 12;

  /**
   * Hash password using BCrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if password is in history
   */
  async isPasswordInHistory(password: string, passwordHistory: string[]): Promise<boolean> {
    if (!passwordHistory || passwordHistory.length === 0) {
      return false;
    }

    for (const historicalHash of passwordHistory) {
      const matches = await bcrypt.compare(password, historicalHash);
      if (matches) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate secure reset token
   */
  generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate email verification token
   */
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token for storage (to prevent token leaks from database)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
