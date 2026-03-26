/**
 * notification-config.js — Configuration for the notification service
 *
 * All values configurable via environment variables with sensible defaults.
 * Pure JS, zero dependencies.
 */

// ════════════════════════════════════════════════════
// ENV HELPER
// ════════════════════════════════════════════════════

function envInt(key, fallback) {
  const val = typeof process !== 'undefined' ? process.env?.[key] : null;
  if (val === null || val === undefined) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

// ════════════════════════════════════════════════════
// RETRY CONFIGURATION
// ════════════════════════════════════════════════════

export const RETRY_CONFIG = Object.freeze({
  baseIntervalMs:  envInt('NOTIF_RETRY_BASE_MS', 1000),
  multiplier:      envInt('NOTIF_RETRY_MULTIPLIER', 2),
  jitterMs:        envInt('NOTIF_RETRY_JITTER_MS', 500),
  maxIntervalMs:   envInt('NOTIF_RETRY_MAX_INTERVAL_MS', 30000),
});

// ════════════════════════════════════════════════════
// RATE LIMIT CONFIGURATION
// ════════════════════════════════════════════════════

export const RATE_LIMIT_CONFIG = Object.freeze({
  perUser: {
    maxPerMinute: envInt('NOTIF_RATE_USER_PER_MIN', 10),
    maxPerHour:   envInt('NOTIF_RATE_USER_PER_HOUR', 100),
  },
  perChannel: {
    SMS: {
      maxPerHour: envInt('NOTIF_RATE_SMS_PER_HOUR', 5),
    },
    EMAIL: {
      maxPerHour: envInt('NOTIF_RATE_EMAIL_PER_HOUR', 50),
    },
    IN_APP: {
      maxPerHour: envInt('NOTIF_RATE_INAPP_PER_HOUR', 1000),
    },
  },
  windowMs: envInt('NOTIF_RATE_WINDOW_MS', 60000),
});

// ════════════════════════════════════════════════════
// CHANNEL CONFIGURATION
// ════════════════════════════════════════════════════

export const CHANNEL_CONFIG = Object.freeze({
  IN_APP: {
    enabled: true,
    maxLatencyMs: 1000,
  },
  EMAIL: {
    enabled: true,
    maxLatencyMs: 5000,
    provider: 'sendgrid', // sendgrid | ses | mailgun
  },
  SMS: {
    enabled: true,
    maxLatencyMs: 3000,
    provider: 'twilio',
  },
});

// ════════════════════════════════════════════════════
// LATENCY THRESHOLDS (from requirements §2.1)
// ════════════════════════════════════════════════════

export const LATENCY_THRESHOLDS_MS = Object.freeze({
  CRITICAL: envInt('NOTIF_LATENCY_CRITICAL_MS', 1000),
  HIGH:     envInt('NOTIF_LATENCY_HIGH_MS', 5000),
  MEDIUM:   envInt('NOTIF_LATENCY_MEDIUM_MS', 30000),
  LOW:      envInt('NOTIF_LATENCY_LOW_MS', 300000),
});
