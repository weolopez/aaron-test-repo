/**
 * notification.js â Notification models and types
 *
 * Pure JS, zero dependencies. Works in Node 18+ and modern browsers.
 */

// ââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ENUMS
// ââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const NotificationType = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH:     'HIGH',
  MEDIUM:   'MEDIUM',
  LOW:      'LOW',
});

export const Channel = Object.freeze({
  IN_APP: 'IN_APP',
  EMAIL:  'EMAIL',
  SMS:    'SMS',
});

/** Channels per notification type (from requirements Â§2.1) */
export const TYPE_CHANNELS = Object.freeze({
  [NotificationType.CRITICAL]: [Channel.IN_APP, Channel.EMAIL, Channel.SMS],
  [NotificationType.HIGH]:     [Channel.IN_APP, Channel.EMAIL],
  [NotificationType.MEDIUM]:   [Channel.IN_APP],
  [NotificationType.LOW]:      [Channel.IN_APP],
});

/** Max retry attempts per notification type */
export const TYPE_MAX_RETRIES = Object.freeze({
  [NotificationType.CRITICAL]: 5,
  [NotificationType.HIGH]:     3,
  [NotificationType.MEDIUM]:   2,
  [NotificationType.LOW]:      1,
});

// ââââââââââââââââââââââââââââââââââââââââââââââââââââ
// NOTIFICATION CLASS
// ââââââââââââââââââââââââââââââââââââââââââââââââââââ

let counter = 0;

function generateId() {
  const ts = Date.now().toString(36);
  const seq = (counter++).toString(36).padStart(4, '0');
  const rand = Math.random().toString(36).slice(2, 6);
  return `notif-${ts}-${seq}-${rand}`;
}

export class Notification {
  constructor(type, userId, payload, options = {}) {
    this.id        = options.id || generateId();
    this.type      = type;
    this.userId    = userId;
    this.payload   = payload;
    this.channels  = options.channels || TYPE_CHANNELS[type] || [Channel.IN_APP];
    this.createdAt = options.createdAt || new Date().toISOString();
    this.attempts  = 0;
    this.delivered = new Set();
    this.failed    = new Set();
  }

  get maxRetries() {
    return TYPE_MAX_RETRIES[this.type] ?? 1;
  }

  get isCritical() {
    return this?.type === NotificationType.CRITICAL;
  }

  get isFullyDelivered() {
    return this?.channels.every(ch => this.delivered.has(ch));
  }

  markDelivered(channel) {
    this.delivered.add(channel);
  }

  markFailed(channel) {
    this.failed.add(channel);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      userId: this.userId,
      payload: this.payload,
      channels: this.channels,
      createdAt: this.createdAt,
      attempts: this.attempts,
      delivered: [...this.delivered],
      failed: [...this.failed],
    };
  }
}

/**
 * Factory function for creating notifications.
 * @param {string} type - NotificationType value
 * @param {string} userId - Target user ID
 * @param {object} payload - Notification content { title, body, data? }
 * @returns {Notification}
 */
export function createNotification(type, userId, payload) {
  if (!NotificationType[type]) {
    throw new Error(`Invalid notification type: ${type}`);
  }
  return new Notification(type, userId, payload);
}
