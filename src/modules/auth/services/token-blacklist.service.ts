import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject('REDIS_CLIENT_BLACKLIST') private readonly redis: Redis) {}

  /**
   * Add token to blacklist
   */
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    const key = this.getBlacklistKey(token);
    // Set with TTL equal to token expiration
    await this.redis.setex(key, expiresInSeconds, '1');
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = this.getBlacklistKey(token);
    const result = await this.redis.get(key);
    return result !== null;
  }

  /**
   * Remove token from blacklist (manual removal, rarely needed)
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = this.getBlacklistKey(token);
    await this.redis.del(key);
  }

  /**
   * Get blacklist key
   */
  private getBlacklistKey(token: string): string {
    return `blacklist:${token}`;
  }

  /**
   * Get time remaining until token is removed from blacklist
   */
  async getTimeToLive(token: string): Promise<number> {
    const key = this.getBlacklistKey(token);
    return this.redis.ttl(key);
  }
}
