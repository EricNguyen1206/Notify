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
  // Channel Management
  // =============================================================================

  async joinChannel(userId: string, channelId: string): Promise<void> {
    const pipeline = this.client.multi();

    // Add user to channel members set
    pipeline.sAdd(`channel:${channelId}:members`, userId);

    // Add channel to user's channels set
    pipeline.sAdd(`user:${userId}:channels`, channelId);

    // Update channel member count
    pipeline.sCard(`channel:${channelId}:members`);

    await pipeline.exec();

    // Publish join event
    const joinEvent = {
      type: "channel.member.join",
      user_id: userId,
      channel_id: channelId,
      timestamp: Date.now(),
    };

    await this.publishChannelEvent(channelId, joinEvent);

    logger.debug("User joined channel", { userId, channelId });
  }

  async leaveChannel(userId: string, channelId: string): Promise<void> {
    const pipeline = this.client.multi();

    // Remove user from channel members set
    pipeline.sRem(`channel:${channelId}:members`, userId);

    // Remove channel from user's channels set
    pipeline.sRem(`user:${userId}:channels`, channelId);

    await pipeline.exec();

    // Publish leave event
    const leaveEvent = {
      type: "channel.member.leave",
      user_id: userId,
      channel_id: channelId,
      timestamp: Date.now(),
    };

    await this.publishChannelEvent(channelId, leaveEvent);

    logger.debug("User left channel", { userId, channelId });
  }

  async getChannelMembers(channelId: string): Promise<string[]> {
    return await this.client.sMembers(`channel:${channelId}:members`);
  }

  async isUserInChannel(userId: string, channelId: string): Promise<boolean> {
    return await this.client.sIsMember(`channel:${channelId}:members`, userId);
  }

  // =============================================================================
  // PubSub Operations
  // =============================================================================

  async publishChannelMessage(channelId: string, message: any): Promise<void> {
    const data = JSON.stringify(message);
    await this.client.publish(`chat:channel:${channelId}`, data);
    logger.debug("Published channel message", { channelId });
  }

  async publishChannelEvent(channelId: string, event: any): Promise<void> {
    const data = JSON.stringify(event);
    await this.client.publish(`channel:${channelId}:events`, data);
    logger.debug("Published channel event", { channelId });
  }

  async publishUserNotification(userId: string, notification: any): Promise<void> {
    const data = JSON.stringify(notification);
    await this.client.publish(`user:${userId}:notifications`, data);
    logger.debug("Published user notification", { userId });
  }

  subscribe(channels: string[]) {
    const pubsub = this.client.subscribe(channels);
    logger.debug("Subscribed to channels", { channels });
    return pubsub;
  }

  pSubscribe(patterns: string[]) {
    const pubsub = this.client.pSubscribe(patterns);
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
