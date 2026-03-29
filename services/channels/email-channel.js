/**
 * Email notification channel
 * Handles email delivery with retry logic
 */

const NotificationHelpers = require("../../utils/notification-helpers");

class EmailChannel {
  constructor(config = {}) {
    this.config = {
      host: config.host || "smtp.example.com",
      port: config.port || 587,
      secure: config.secure || false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    this.name = "email";
    this.isInitialized = false;
  }

  /**
   * Initialize the email channel
   * @returns {Promise<void>}
   */
  async initialize() {
    // In production, this would set up SMTP connection
    this.isInitialized = true;
    return { success: true, message: "Email channel initialized" };
  },

  /**
   * Validate email recipient
   * @param {string} recipient
   * @returns {boolean}
   */
  validateRecipient(recipient) {
    return NotificationHelpers.isValidEmail(recipient);
  },

  /**
   * Send email notification
   * @param {object} notification
   * @returns {Promise<object>}
   */
  async send(notification) {
    const { recipient, subject, message, options = {} } = notification;

    if (!this.validateRecipient(recipient)) {
      return {
        success: false,
        error: "Invalid email recipient",
        channel: this.name
      };
    }

    let lastError = null;
    const maxAttempts = this.config.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Simulate email sending (replace with actual SMTP implementation)
        const result = await this._sendEmail({
          to: recipient,
          subject: subject || "Notification",
          text: NotificationHelpers.formatMessage(message),
          html: options.html || null
        });

        return {
          success: true,
          channel: this.name,
          messageId: result.messageId,
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
      error: lastError?.message || "Failed to send email after retries",
      channel: this.name,
      attempts: maxAttempts
    };
  },

  /**
   * Internal method to simulate sending email
   * @private
   */
  async _sendEmail(options) {
    // Simulate async email delivery
    await this._delay(100);
    return {
      messageId: `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
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
        host: this.config.host,
        port: this.config.port,
        maxRetries: this.config.maxRetries
      }
    };
  }
}

module.exports = EmailChannel;