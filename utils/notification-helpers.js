/**
 * Notification helper utilities
 * Provides validation, formatting, and common utilities for notification handling
 */

// Validation helpers
const NotificationHelpers = {
  /**
   * Validate email address format
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Validate phone number format (basic international support)
   * @param {string} phone
   * @returns {boolean}
   */
  isValidPhone(phone) {
    if (!phone || typeof phone !== "string") return false;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ""));
  },

  /**
   * Validate notification type
   * @param {string} type
   * @returns {boolean}
   */
  isValidNotificationType(type) {
    const validTypes = ["email", "sms", "push", "in-app"];
    return validTypes.includes(type);
  },

  /**
   * Validate notification payload
   * @param {object} payload
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validatePayload(payload) {
    const errors = [];

    if (!payload) {
      errors.push("Payload is required");
      return { valid: false, errors };
    }

    if (!payload.type) {
      errors.push("Notification type is required");
    } else if (!this.isValidNotificationType(payload.type)) {
      errors.push(`Invalid notification type: ${payload.type}`);
    }

    if (!payload.recipient) {
      errors.push("Recipient is required");
    } else if (payload.type === "email" && !this.isValidEmail(payload.recipient)) {
      errors.push("Invalid email recipient format");
    } else if (payload.type === "sms" && !this.isValidPhone(payload.recipient)) {
      errors.push("Invalid phone recipient format");
    }

    if (!payload.message) {
      errors.push("Message content is required");
    } else if (payload.message.length > 10000) {
      errors.push("Message exceeds maximum length of 10000 characters");
    }

    return { valid: errors.length === 0, errors };
  },

  // Formatting helpers

  /**
   * Format message for display
   * @param {string} message
   * @param {object} options
   * @returns {string}
   */
  formatMessage(message, options = {}) {
    const { maxLength = 500, addEllipsis = true } = options;
    if (!message) return "";

    const trimmed = message.trim();
    if (trimmed.length <= maxLength) return trimmed;

    return addEllipsis ? trimmed.slice(0, maxLength - 3) + "..." : trimmed.slice(0, maxLength);
  },

  /**
   * Format timestamp for display
   * @param {Date|string|number} timestamp
   * @returns {string}
   */
  formatTimestamp(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toISOString();
  },

  /**
   * Generate unique notification ID
   * @returns {string}
   */
  generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `notif_${timestamp}_${random}`;
  },

  /**
   * Create notification metadata
   * @param {object} options
   * @returns {object}
   */
  createMetadata(options = {}) {
    return {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      priority: options.priority || "normal",
      category: options.category || "general",
      metadata: options.metadata || {}
    };
  }
};

module.exports = NotificationHelpers;