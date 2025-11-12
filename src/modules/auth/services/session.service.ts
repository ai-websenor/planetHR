import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  userId: string;
  sessionId: string;
  organizationId: string;
  email: string;
  role: string;
  assignedBranches: string[];
  assignedDepartments: string[];
  createdAt: Date;
  lastActivityAt: Date;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class SessionService {
  private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly MAX_SESSIONS_PER_USER = 3;
  private readonly redisClient: Redis;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = redis;
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId,
    email: string,
    role: string,
    assignedBranches: Types.ObjectId[],
    assignedDepartments: Types.ObjectId[],
    ipAddress: string,
    userAgent: string,
  ): Promise<string> {
    const sessionId = uuidv4();
    const sessionData: SessionData = {
      userId: userId.toString(),
      sessionId,
      organizationId: organizationId.toString(),
      email,
      role,
      assignedBranches: assignedBranches.map(b => b.toString()),
      assignedDepartments: assignedDepartments.map(d => d.toString()),
      createdAt: new Date(),
      lastActivityAt: new Date(),
      ipAddress,
      userAgent,
    };

    const sessionKey = this.getSessionKey(userId.toString(), sessionId);

    // Store session
    await this.redisClient.setex(
      sessionKey,
      this.SESSION_TTL,
      JSON.stringify(sessionData),
    );

    // Manage concurrent sessions
    await this.enforceConcurrentSessionLimit(userId.toString());

    return sessionId;
  }

  /**
   * Get session data
   */
  async getSession(userId: string, sessionId: string): Promise<SessionData | null> {
    const sessionKey = this.getSessionKey(userId, sessionId);
    const data = await this.redisClient.get(sessionKey);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(userId: string, sessionId: string): Promise<void> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return;
    }

    session.lastActivityAt = new Date();
    const sessionKey = this.getSessionKey(userId, sessionId);

    // Update with sliding expiration
    await this.redisClient.setex(
      sessionKey,
      this.SESSION_TTL,
      JSON.stringify(session),
    );
  }

  /**
   * Delete a specific session
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const sessionKey = this.getSessionKey(userId, sessionId);
    await this.redisClient.del(sessionKey);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllUserSessions(userId: string): Promise<void> {
    const pattern = `session:${userId}:*`;
    const keys = await this.redisClient.keys(pattern);

    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const pattern = `session:${userId}:*`;
    const keys = await this.redisClient.keys(pattern);

    if (keys.length === 0) {
      return [];
    }

    const sessions: SessionData[] = [];
    for (const key of keys) {
      const data = await this.redisClient.get(key);
      if (data) {
        sessions.push(JSON.parse(data));
      }
    }

    return sessions.sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    );
  }

  /**
   * Validate session against IP and User-Agent (hijacking detection)
   */
  async validateSession(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    const session = await this.getSession(userId, sessionId);

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    // Check for IP address mismatch (potential hijacking)
    if (session.ipAddress !== ipAddress) {
      return { valid: false, reason: 'IP address mismatch - potential session hijacking' };
    }

    // Check for User-Agent mismatch
    if (session.userAgent !== userAgent) {
      return { valid: false, reason: 'User-Agent mismatch - potential session hijacking' };
    }

    return { valid: true };
  }

  /**
   * Enforce maximum concurrent sessions per user
   */
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length > this.MAX_SESSIONS_PER_USER) {
      // Delete oldest sessions
      const sessionsToDelete = sessions.slice(this.MAX_SESSIONS_PER_USER);
      for (const session of sessionsToDelete) {
        await this.deleteSession(userId, session.sessionId);
      }
    }
  }

  /**
   * Get session key for Redis
   */
  private getSessionKey(userId: string, sessionId: string): string {
    return `session:${userId}:${sessionId}`;
  }

  /**
   * Count active sessions for a user
   */
  async countUserSessions(userId: string): Promise<number> {
    const pattern = `session:${userId}:*`;
    const keys = await this.redisClient.keys(pattern);
    return keys.length;
  }
}
