/**
 * notification.js ÃÂ¢ÃÂÃÂ NotificationManager and RetryEngine
 *
 * Implements ADR-001: priority-queue-based notification dispatcher
 * with exponential backoff retry, rate limiting, and graceful degradation.
 *
 * Pure JS, zero dependencies. Works in Node 18+ and modern browsers.
 */

import { NotificationType, Channel, TYPE_CHANNELS, TYPE_MAX_RETRIES } from '../models/notification.js';
import { RETRY_CONFIG, RATE_LIMIT_CONFIG } from '../config/notification-config.js';

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
// RETRY ENGINE
// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ

export class RetryEngine {
  constructor(config = RETRY_CONFIG) {
    this.baseIntervalMs = config.baseIntervalMs;
    this.multiplier     = config.multiplier;
    this.jitterMs       = config.jitterMs;
    this.maxIntervalMs  = config.maxIntervalMs;
  }

  /**
   * Calculate delay for a given attempt number.
   * @param {number} attempt - 0-indexed attempt number
   * @returns {number} delay in milliseconds
   */
  getDelay(attempt) {
    const base = this.baseIntervalMs * Math.pow(this.multiplier, attempt);
    const capped = Math.min(base, this.maxIntervalMs);
    const jitter = (Math.random() - 0.5) * 2 * this.jitterMs;
    return Math.max(0, Math.round(capped + jitter));
  }

  /**
   * Execute a function with retry logic.
   * @param {Function} fn - async function to execute
   * @param {number} maxRetries - maximum number of retry attempts
   * @param {Function} [onRetry] - callback(attempt, delay, error)
   * @returns {Promise<*>} result of fn
   */
  async execute(fn, maxRetries, onRetry) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastError = err;
        if (attempt + 1 < maxRetries) {
          const delay = this.getDelay(attempt);
          if (onRetry) onRetry(attempt, delay, err);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
// RATE LIMITER (sliding window)
// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ

export class RateLimiter {
  constructor(config = RATE_LIMIT_CONFIG) {
    this.config = config;
    this.windows = new Map(); // key -> [timestamps]
  }

  /**
   * Check if a notification is allowed under rate limits.
   * CRITICAL notifications always pass.
   * @param {string} userId
   * @param {string} channel
   * @param {boolean} isCritical
   * @returns {{ allowed: boolean, retryAfter: number }}
   */
  check(userId, channel, isCritical = false) {
    if (isCritical) return { allowed: true, retryAfter: 0 };

    const now = Date.now();
    const minuteAgo = now - 60_000;
    const hourAgo   = now - 3_600_000;

    // Per-user per-minute check
    const userKey = `user:${userId}`;
    const userWindow = this._getWindow(userKey);
    const userPerMin = userWindow.filter(t => t > minuteAgo).length;
    if (userPerMin >= this.config.perUser.maxPerMinute) {
      return { allowed: false, retryAfter: 60_000 - (now - userWindow[0]) };
    }

    // Per-user per-hour check
    const userPerHour = userWindow.filter(t => t > hourAgo).length;
    if (userPerHour >= this.config.perUser.maxPerHour) {
      return { allowed: false, retryAfter: 3_600_000 - (now - userWindow[0]) };
    }

    // Per-channel per-hour check
    const channelConfig = this.config.perChannel[channel];
    if (channelConfig) {
      const chKey = `channel:${userId}:${channel}`;
      const chWindow = this._getWindow(chKey);
      const chPerHour = chWindow.filter(t => t > hourAgo).length;
      if (chPerHour >= channelConfig.maxPerHour) {
        return { allowed: false, retryAfter: 3_600_000 - (now - chWindow[0]) };
      }
    }

    return { allowed: true, retryAfter: 0 };
  }

  /**
   * Record that a notification was sent.
   */
  record(userId, channel) {
    const now = Date.now();
    this._getWindow(`user:${userId}`).push(now);
    this._getWindow(`channel:${userId}:${channel}`).push(now);
  }

  _getWindow(key) {
    if (!this.windows.has(key)) this.windows.set(key, []);
    const w = this.windows.get(key);
    // Prune entries older than 1 hour
    const hourAgo = Date.now() - 3_600_000;
    while (w.length > 0 && w[0] < hourAgo) w.shift();
    return w;
  }
}

// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ
// NOTIFICATION MANAGER
// ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ

export class NotificationManager {
  constructor({ channels = {}, retryEngine, rateLimiter, log } = {}) {
    this.channels     = channels;       // { IN_APP: adapter, EMAIL: adapter, ... }
    this.retryEngine  = retryEngine  || new RetryEngine();
    this.rateLimiter  = rateLimiter  || new RateLimiter();
    this.log          = log          || console.log;
    this.deadLetter   = [];             // Notifications that exhausted retries
    this.stats        = { sent: 0, failed: 0, rateLimited: 0 };
  }

  /**
   * Send a notification across all applicable channels.
   * Implements graceful degradation: channel failures don't block others.
   *
   * @param {import('../models/notification.js').Notification} notification
   * @returns {Promise<{ delivered: string[], failed: string[], rateLimited: string[] }>}
   */
  async send(notification) {
    const results = { delivered: [], failed: [], rateLimited: [] };

    // Process each channel in parallel (graceful degradation)
    const promises = notification.channels.map(async (channel) => {
      // Rate limit check
      const rateCheck = this.rateLimiter.check(
        notification.userId, channel, notification.isCritical
      );

      if (!rateCheck.allowed) {
        results.rateLimited.push(channel);
        this.stats.rateLimited++;
        this.log(`[rate-limited] ${notification.id} on ${channel} (retry after ${rateCheck.retryAfter}ms)`);
        return;
      }

      // Deliver with retry
      try {
        await this._deliverWithRetry(notification, channel);
        notification.markDelivered(channel);
        results.delivered.push(channel);
        this.rateLimiter.record(notification.userId, channel);
        this.stats.sent++;
      } catch (err) {
        notification.markFailed(channel);
        results.failed.push(channel);
        this.stats.failed++;
        this.log(`[failed] ${notification.id} on ${channel}: ${err.message}`);
      }
    });

    await Promise.all(promises);

    // Dead letter if all channels failed
    if (results.delivered.length === 0 && results.failed.length > 0) {
      this.deadLetter.push(notification.toJSON());
    }

    return results;
  }

  /**
   * Deliver to a single channel with retry.
   */
  async _deliverWithRetry(notification, channel) {
    const adapter = this.channels[channel];
    if (!adapter) {
      throw new Error(`No adapter registered for channel: ${channel}`);
    }

    return this?.retryEngine.execute(
      () => adapter.deliver(notification),
      notification.maxRetries,
      (attempt, delay, err) => {
        this.log(`[retry] ${notification.id} on ${channel}: attempt ${attempt + 1}, delay ${delay}ms (${err.message})`);
      }
    );
  }

  /**
   * Get service statistics.
   */
  getStats() {
    return {
      ...this.stats,
      deadLetterCount: this.deadLetter.length,
    };
  }
}
