/**
 * Notification model
 * Defines the structure and validation for notification objects
 */

const NotificationHelpers = require("../utils/notification-helpers");

// Notification statuses
const NotificationStatus = {
  PENDING: "pending",
  QUEUED: "queued",
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
  CANCELLED: "cancelled"
};

// Priority levels
const Priority = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent"
};

class Notification {
  constructor(data = {}) {
    this.id = data.id || NotificationHelpers.generateId();
    this.type = data.type || null;
    this.recipient = data.recipient || null;
    this.subject = data.subject || null;
    this.message = data.message || "";
    this.status = data.status || NotificationStatus.PENDING;
    this.priority = data.priority || Priority.NORMAL;
    this.channel = data.channel || null;
    this.metadata = data.metadata || {};
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.scheduledAt = data.scheduledAt || null;
    this.sentAt = data.sentAt || null;
    this.deliveredAt = data.deliveredAt || null;
    
    // Delivery tracking
    this.deliveryAttempts = data.deliveryAttempts || [];
    this.maxRetries = data.maxRetries || 3;
    this.lastError = data.lastError || null;
  }

  /**
   * Validate the notification
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (!this.type) {
      errors.push("Notification type is required");
    } else if (!NotificationHelpers.isValidNotificationType(this.type)) {
      errors.push(`Invalid notification type: ${this.type}`);
    }

    if (!this.recipient) {
      errors.push("Recipient is required");
    } else if (this.type === "email" && !NotificationHelpers.isValidEmail(this.recipient)) {
      errors.push("Invalid email recipient format");
    } else if (this.type === "sms" && !NotificationHelpers.isValidPhone(this.recipient)) {
      errors.push("Invalid phone recipient format");
    }

    if (!this.message) {
      errors.push("Message content is required");
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Record a delivery attempt
   * @param {object} attempt
   */
  recordAttempt(attempt) {
    this.deliveryAttempts.push({
      ...attempt,
      timestamp: new Date().toISOString()
    });
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Update the notification status
   * @param {string} newStatus
   */
  updateStatus(newStatus) {
    this.status = newStatus;
    this.updatedAt = new Date().toISOString();
    
    if (newStatus === NotificationStatus.SENT) {
      this.sentAt = new Date().toISOString();
    } else if (newStatus === NotificationStatus.DELIVERED) {
      this.deliveredAt = new Date().toISOString();
    }
  }

  /**
   * Check if notification can be retried
   * @returns {boolean}
   */
  canRetry() {
    return this.status === NotificationStatus.FAILED && 
           this.deliveryAttempts.length < this.maxRetries;
  }

  /**
   * Get the notification as a plain object
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      recipient: this.recipient,
      subject: this.subject,
      message: this.message,
      status: this.status,
      priority: this.priority,
      channel: this.channel,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      scheduledAt: this.scheduledAt,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      deliveryAttempts: this.deliveryAttempts,
      maxRetries: this.maxRetries,
      lastError: this.lastError
    };
  }

  /**
   * Create a Notification from plain object
   * @param {object} data
   * @returns {Notification}
   */
  static fromJSON(data) {
    return new Notification(data);
  }
}

module.exports = {
  Notification,
  NotificationStatus,
  Priority
};