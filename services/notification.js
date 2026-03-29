/**
 * Notification Service
 * Main service for managing and dispatching notifications
 */

const { Notification, NotificationStatus, Priority } = require("../models/notification");
const NotificationHelpers = require("../utils/notification-helpers");
const { getChannelConfig, isChannelEnabled, getGlobalConfig } = require("../config/notification-config");
const EmailChannel = require("./channels/email-channel");
const SMSChannel = require("./channels/sms-channel");
const PushChannel = require("./channels/push-channel");

class NotificationService {
  constructor(config = {}) {
    this.config = {
      ...getGlobalConfig(),
      ...config
    };
    this.channels = {};
    this.queue = [];
    this.history = [];
    this.isInitialized = false;
  }

  /**
   * Initialize the notification service and all enabled channels
   * @returns {Promise<void>}
   */
  async initialize() {
    // Initialize email channel if enabled
    if (isChannelEnabled("email")) {
      this.channels.email = new EmailChannel(getChannelConfig("email"));
      await this.channels.email.initialize();
    }

    // Initialize SMS channel if enabled
    if (isChannelEnabled("sms")) {
      this.channels.sms = new SMSChannel(getChannelConfig("sms"));
      await this.channels.sms.initialize();
    }

    // Initialize push channel if enabled
    if (isChannelEnabled("push")) {
      this.channels.push = new PushChannel(getChannelConfig("push"));
      await this.channels.push.initialize();
    }

    this.isInitialized = true;
    return { success: true, channels: Object.keys(this.channels) };
  }

  /**
   * Send a notification
   * @param {object} options
   * @returns {Promise<object>}
   */
  async send(options) {
    // Create notification object
    const notification = new Notification({
      type: options.type,
      recipient: options.recipient,
      subject: options.subject,
      message: options.message,
      priority: options.priority || Priority.NORMAL,
      metadata: options.metadata || {}
    });

    // Validate notification
    const validation = notification.validate();
    if (!validation.valid) {
      return {
        success: false,
        error: "Validation failed",
        errors: validation.errors
      };
    }

    // Check if channel is available
    const channel = this._getChannelForType(notification.type);
    if (!channel) {
      notification.updateStatus(NotificationStatus.FAILED);
      notification.lastError = `Channel not available for type: ${notification.type}`;
      this._recordNotification(notification);
      return {
        success: false,
        error: notification.lastError
      };
    }

    // Update status and send
    notification.updateStatus(NotificationStatus.SENDING);
    notification.channel = notification.type;

    const result = await this._sendWithRetry(notification, channel);

    // Record in history
    this._recordNotification(notification);

    return result;
  }

  /**
   * Send notification with retry logic
   * @private
   */
  async _sendWithRetry(notification, channel) {
    const maxAttempts = this.config.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await channel.send({
          recipient: notification.recipient,
          subject: notification.subject,
          message: notification.message,
          options: notification.metadata
        });

        if (result.success) {
          notification.updateStatus(NotificationStatus.SENT);
          notification.recordAttempt({
            attempt,
            success: true,
            messageId: result.messageId
          });

          return {
            success: true,
            notification: notification.toJSON(),
            messageId: result.messageId
          };
        }

        // Channel returned failure
        notification.recordAttempt({
          attempt,
          success: false,
          error: result.error
        });

        if (attempt < maxAttempts) {
          await this._delay(this.config.retryDelay * attempt);
        }
      } catch (error) {
        notification.recordAttempt({
          attempt,
          success: false,
          error: error.message
        });

        if (attempt < maxAttempts) {
          await this._delay(this.config.retryDelay * attempt);
        }
      }
    }

    // All attempts failed
    notification.updateStatus(NotificationStatus.FAILED);
    notification.lastError = "All delivery attempts failed";

    return {
      success: false,
      notification: notification.toJSON(),
      error: notification.lastError
    };
  }

  /**
   * Get the appropriate channel for a notification type
   * @private
   */
  _getChannelForType(type) {
    return this.channels[type] || null;
  }

  /**
   * Record notification in history
   * @private
   */
  _recordNotification(notification) {
    this.history.push(notification.toJSON());
    // Keep history bounded
    if (this.history.length > 10000) {
      this.history = this.history.slice(-5000);
    }
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get notification history
   * @param {object} filters
   * @returns {array}
   */
  getHistory(filters = {}) {
    let results = [...this.history];

    if (filters.status) {
      results = results.filter(n => n.status === filters.status);
    }
    if (filters.type) {
      results = results.filter(n => n.type === filters.type);
    }
    if (filters.recipient) {
      results = results.filter(n => n.recipient === filters.recipient);
    }

    return results;
  }

  /**
   * Get service status
   * @returns {object}
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      channels: Object.keys(this.channels),
      queueSize: this.queue.length,
      historySize: this.history.length
    };
  }

  /**
   * Retry a failed notification
   * @param {string} notificationId
   * @returns {Promise<object>}
   */
  async retry(notificationId) {
    const notification = this.history.find(n => n.id === notificationId);
    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    const notifObj = Notification.fromJSON(notification);
    if (!notifObj.canRetry()) {
      return { success: false, error: "Notification cannot be retried" };
    }

    notifObj.updateStatus(NotificationStatus.PENDING);
    return this.send(notifObj.toJSON());
  }
}

module.exports = {
  NotificationService,
  Notification,
  NotificationStatus,
  Priority
};