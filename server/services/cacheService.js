import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisClient = null;
const memoryCache = new Map(); // Fallback in-memory set cache if Redis is offline

export const connectRedis = async () => {
  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => {
      // Log error but don't crash the server
      console.warn('Redis client reporting error:', err.message);
    });
    await redisClient.connect();
    console.log('Redis Connection established successfully.');
  } catch (error) {
    console.warn(`Redis connection failed: ${error.message}. Falling back to system memory cache.`);
    redisClient = null;
  }
};

/**
 * Tracks a swipe operation (adds candidate to swiped set)
 */
export const trackSwipe = async (userId, swipedUserId) => {
  const cacheKey = `user:${userId}:swipes`;
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.sAdd(cacheKey, swipedUserId.toString());
      // Expire swipe cache after 24 hours to refresh decks daily
      await redisClient.expire(cacheKey, 86400);
      return;
    } catch (err) {
      console.error('Redis sAdd error, switching to memory:', err);
    }
  }

  // Fallback storage
  if (!memoryCache.has(userId)) {
    memoryCache.set(userId, new Set());
  }
  memoryCache.get(userId).add(swipedUserId.toString());
};

/**
 * Checks if a user has already swiped a candidate
 */
export const hasSwiped = async (userId, candidateId) => {
  const cacheKey = `user:${userId}:swipes`;
  if (redisClient && redisClient.isOpen) {
    try {
      return await redisClient.sIsMember(cacheKey, candidateId.toString());
    } catch (err) {
      console.error('Redis sIsMember error, switching to memory:', err);
    }
  }

  // Fallback retrieval
  if (!memoryCache.has(userId)) {
    return false;
  }
  return memoryCache.get(userId).has(candidateId.toString());
};

/**
 * Retrieves all swiped candidates for a user
 */
export const getSwipedUsers = async (userId) => {
  const cacheKey = `user:${userId}:swipes`;
  if (redisClient && redisClient.isOpen) {
    try {
      return await redisClient.sMembers(cacheKey);
    } catch (err) {
      console.error('Redis sMembers error, switching to memory:', err);
    }
  }

  // Fallback retrieval
  if (!memoryCache.has(userId)) {
    return [];
  }
  return Array.from(memoryCache.get(userId));
};
