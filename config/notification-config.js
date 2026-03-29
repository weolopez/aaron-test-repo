/**
 * Notification configuration
 * Centralized configuration for all notification channels
 */

const notificationConfig = {
  // Global settings
  global: {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    enableLogging: true
  },

  // Email channel configuration
  email: {
    enabled: true,
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true" || false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || ""
    },
    maxRetries: 3,
    retryDelay: 1000,
    defaults: {
      from: process.env.NOTIFICATION_FROM_EMAIL || "noreply@example.com",
      subjectPrefix: "[Notification]"
    }
  },

  // SMS channel configuration
  sms: {
    enabled: true,
    provider: process.env.SMS_PROVIDER || "twilio",
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    fromNumber: process.env.SMS_FROM_NUMBER || "+1234567890",
    maxRetries: 3,
    retryDelay: 2000,
    maxLength: 1600,
    defaults: {
      sender: process.env.SMS_SENDER_NAME || "App"
    }
  },

  // Push notification configuration
  push: {
    enabled: true,
    provider: process.env.PUSH_PROVIDER || "firebase",
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID || "",
      privateKey: process.env.FIREBASE_PRIVATE_KEY || "",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || ""
    },
    maxRetries: 3,
    retryDelay: 1500,
    defaults: {
      sound: "default",
      badge: true
    }
  },

  // Rate limiting
  rateLimiting: {
    enabled: true,
    maxPerMinute: 60,
    maxPerHour: 1000,
    maxPerDay: 10000
  },

  // Queue settings
  queue: {
    enabled: true,
    maxSize: 10000,
    concurrency: 5,
    flushInterval: 5000
  }
};

/**
 * Get configuration for a specific channel
 * @param {string} channel
 * @returns {object}
 */
function getChannelConfig(channel) {
  return notificationConfig[channel] || null;
}

/**
 * Get global configuration
 * @returns {object}
 */
function getGlobalConfig() {
  return notificationConfig.global;
}

/**
 * Check if a channel is enabled
 * @param {string} channel
 * @returns {boolean}
 */
function isChannelEnabled(channel) {
  const config = notificationConfig[channel];
  return config && config.enabled === true;
}

module.exports = {
  notificationConfig,
  getChannelConfig,
  getGlobalConfig,
  isChannelEnabled
};