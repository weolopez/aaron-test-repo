/**
 * Notification Service - Main Entry Point
 * Exports the public API for the notification system
 */

// Core service
const { NotificationService, Notification, NotificationStatus, Priority } = require("./services/notification");

// Channels
const EmailChannel = require("./services/channels/email-channel");
const SMSChannel = require("./services/channels/sms-channel");
const PushChannel = require("./services/channels/push-channel");

// Utilities
const NotificationHelpers = require("./utils/notification-helpers");

// Configuration
const { notificationConfig, getChannelConfig, getGlobalConfig, isChannelEnabled } = require("./config/notification-config");

// Models
const { Notification: NotificationModel } = require("./models/notification");

// Default export - create a singleton instance
const defaultService = new NotificationService();

module.exports = {
  // Service class and singleton
  NotificationService,
  defaultService,

  // Models
  Notification,
  NotificationModel,
  NotificationStatus,
  Priority,

  // Channels
  EmailChannel,
  SMSChannel,
  PushChannel,

  // Utilities
  NotificationHelpers,

  // Configuration
  notificationConfig,
  getChannelConfig,
  getGlobalConfig,
  isChannelEnabled
};