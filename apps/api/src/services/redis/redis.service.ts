import { RedisClientType } from "redis";
import { getRedisConnection } from "@/config/redis";
import { logger } from "@/utils/logger";

export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = getRedisConnection().getClient();
  }

  // =============================================================================
  // User Status Management
  // =============================================================================

  async setUserOnline(userId: string): Promise<void> {
    const pipeline = this.client.multi();

    // Add to online users set
    pipeline.sAdd("online_users", userId);

    // Set user status hash
    pipeline.hSet(`user:${userId}:status`, {
      status: "online",
      last_seen: Date.now(),
      updated_at: Date.now(),
    });

    // Set expiration for status (5 minutes)
    pipeline.expire(`user:${userId}:status`, 300);

    await pipeline.exec();

    logger.debug("User set to online", { userId });
  }

  async setUserOffline(userId: string): Promise<void> {
    const pipeline = this.client.multi();

    // Remove from online users set
    pipeline.sRem("online_users", userId);

    // Update user status
    pipeline.hSet(`user:${userId}:status`, {
      status: "offline",
      last_seen: Date.now(),
      updated_at: Date.now(),
    });

    // Set longer expiration for offline status (24 hours)
    pipeline.expire(`user:${userId}:status`, 86400);

    await pipeline.exec();

    logger.debug("User set to offline", { userId });
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const result = await this.client.sIsMember("online_users", userId);
    return result;
  }

  async getOnlineUsers(): Promise<string[]> {
    return await this.client.sMembers("online_users");
  }

  // =============================================================================
  // Conversation Management
  // =============================================================================

  async joinConversation(userId: string, conversationId: string): Promise<void> {
    const pipeline = this.client.multi();

    // Add user to conversation members set
    pipeline.sAdd(`conversation:${conversationId}:members`, userId);

    // Add conversation to user's conversations set
    pipeline.sAdd(`user:${userId}:conversations`, conversationId);

    // Update conversation member count
    pipeline.sCard(`conversation:${conversationId}:members`);

    await pipeline.exec();

    // Publish join event
    const joinEvent = {
      type: "conversation.member.join",
      user_id: userId,
      conversation_id: conversationId,
      timestamp: Date.now(),
    };

    await this.publishConversationEvent(conversationId, joinEvent);

    logger.debug("User joined conversation", { userId, conversationId });
  }

  async leaveConversation(userId: string, conversationId: string): Promise<void> {
    const pipeline = this.client.multi();

    // Remove user from conversation members set
    pipeline.sRem(`conversation:${conversationId}:members`, userId);

    // Remove conversation from user's conversations set
    pipeline.sRem(`user:${userId}:conversations`, conversationId);

    await pipeline.exec();

    // Publish leave event
    const leaveEvent = {
      type: "conversation.member.leave",
      user_id: userId,
      conversation_id: conversationId,
      timestamp: Date.now(),
    };

    await this.publishConversationEvent(conversationId, leaveEvent);

    logger.debug("User left conversation", { userId, conversationId });
  }

  async getConversationMembers(conversationId: string): Promise<string[]> {
    return await this.client.sMembers(`conversation:${conversationId}:members`);
  }

  async isUserInConversation(userId: string, conversationId: string): Promise<boolean> {
    return await this.client.sIsMember(`conversation:${conversationId}:members`, userId);
  }

  // =============================================================================
  // PubSub Operations
  // =============================================================================

  async publishConversationMessage(conversationId: string, message: any): Promise<void> {
    const data = JSON.stringify(message);
    await this.client.publish(`chat:conversation:${conversationId}`, data);
    logger.debug("Published conversation message", { conversationId });
  }

  async publishConversationEvent(conversationId: string, event: any): Promise<void> {
    const data = JSON.stringify(event);
    await this.client.publish(`conversation:${conversationId}:events`, data);
    logger.debug("Published conversation event", { conversationId });
  }

  async publishUserNotification(userId: string, notification: any): Promise<void> {
    const data = JSON.stringify(notification);
    await this.client.publish(`user:${userId}:notifications`, data);
    logger.debug("Published user notification", { userId });
  }

  subscribe(channels: string[]): ReturnType<RedisClientType["duplicate"]> {
    const pubsub = this.client.duplicate();
    // @ts-ignore - subscribe signature varies by Redis client version
    pubsub.subscribe(...channels);
    logger.debug("Subscribed to channels", { channels });
    return pubsub;
  }

  pSubscribe(patterns: string[]): ReturnType<RedisClientType["duplicate"]> {
    const pubsub = this.client.duplicate();
    // @ts-ignore - pSubscribe signature varies by Redis client version
    pubsub.pSubscribe(...patterns);
    logger.debug("Pattern subscribed to channels", { patterns });
    return pubsub;
  }

  // =============================================================================
  // Rate Limiting
  // =============================================================================

  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const pipeline = this.client.multi();

    // Remove old entries
    pipeline.zRemRangeByScore(key, "0", windowStart.toString());

    // Count current entries
    pipeline.zCard(key);

    // Add current request
    pipeline.zAdd(key, {
      score: now,
      value: now.toString(),
    });

    // Set expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();

    if (!results || results.length < 2) {
      return false;
    }

    // Get count result (index 1 is the zCard result)
    const count = results[1] as number;

    return count < limit;
  }

  // =============================================================================
  // Migration State Management
  // =============================================================================

  async setMigrationState(version: string, status: string): Promise<void> {
    await this.client.hSet("db:migration:status", {
      version,
      status,
      updated_at: Date.now(),
    });
  }

  async getMigrationState(): Promise<Record<string, string>> {
    return await this.client.hGetAll("db:migration:status");
  }

  // =============================================================================
  // Cache Operations
  // =============================================================================

  async set(key: string, value: any, expirationSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (expirationSeconds) {
      await this.client.setEx(key, expirationSeconds, data);
    } else {
      await this.client.set(key, data);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    return JSON.parse(data);
  }

  async delete(keys: string[]): Promise<number> {
    return await this.client.del(keys);
  }
}
