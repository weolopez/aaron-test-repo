/**
 * SMS notification channel
 * Handles SMS delivery with retry logic
 */

const NotificationHelpers = require("../../utils/notification-helpers");

class SMSChannel {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || "twilio",
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 2000,
      maxLength: config.maxLength || 1600,
      ...config
    };
    this.name = "sms";
    this.isInitialized = false;
  }

  /**
   * Initialize the SMS channel
   * @returns {Promise<void>}
   */
  async initialize() {
    // In production, this would set up SMS provider connection
    this.isInitialized = true;
    return { success: true, message: "SMS channel initialized" };
  }

  /**
   * Validate phone number recipient
   * @param {string} recipient
   * @returns {boolean}
   */
  validateRecipient(recipient) {
    return NotificationHelpers.isValidPhone(recipient);
  }

  /**
   * Send SMS notification
   * @param {object} notification
   * @returns {Promise<object>}
   */
  async send(notification) {
    const { recipient, message, options = {} } = notification;

    if (!this.validateRecipient(recipient)) {
      return {
        success: false,
        error: "Invalid phone number recipient",
        channel: this.name
      };
    }

    let lastError = null;
    const maxAttempts = this.config.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Simulate SMS sending (replace with actual provider implementation)
        const result = await this._sendSMS({
          to: recipient,
          body: NotificationHelpers.formatMessage(message, { maxLength: this.config.maxLength })
        });

        return {
          success: true,
          channel: this.name,
          messageId: result.messageId,
          segments: result.segments,
          attempt,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await this._delay(this.config.retryDelay * attempt);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || "Failed to send SMS after retries",
      channel: this.name,
      attempts: maxAttempts
    };
  },

  /**
   * Internal method to simulate sending SMS
   * @private
   */
  async _sendSMS(options) {
    // Simulate async SMS delivery
    await this._delay(150);
    const segments = Math.ceil(options.body.length / 160);
    return {
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      segments
    };
  },

  /**
   * Delay helper for retry logic
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Get channel status
   * @returns {object}
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      config: {
        provider: this.config.provider,
        maxRetries: this.config.maxRetries,
        maxLength: this.config.maxLength
      }
    };
  }
}

module.exports = SMSChannel;