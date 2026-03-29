# Notification Service

A notification service for handling multi-channel notifications (Email, SMS, Push).

## Overview

## Features

- **Multi-channel Support**: Email, SMS, and Push notifications
- **Template-based Messages**: Customizable notification templates
- **Priority Queue**: Handle notifications based on priority
- **Retry Logic**: Automatic retry for failed deliveries
- **Configurable**: Easy configuration for different channels

## Installation

```bash
npm install
```

## Usage

```javascript
const { NotificationService } = require('./services/notification');

const notification = {
  type: 'email',
  to: 'user@example.com',
  subject: 'Hello',
  body: 'This is a test notification'
};

await notificationService.send(notification);
```

## Project Structure

```
src/
  .aaron/memory/project-memory.md
  .aaron/skills/test-skill/SKILL.md
  .aaron/workflows/test-workflow.json
  ADR.md
  README.md
  config/notification-config.js
  docs/requirements.md
  index.js
  models/notification.js
  plan-notification-service.md
  services/channels/email-channel.js
  services/channels/push-channel.js
  services/channels/sms-channel.js
  services/notification.js
  src/config/notification-config.js
  src/index.js
  src/models/notification.js
  src/services/notification.js
  utils/notification-helpers.js
```

## API Reference

### NotificationService

- `send(notification)` - Send a notification through the configured channel
- `setChannel(channel)` - Set the notification channel (email, sms, push)
- `configure(options)` - Configure service options

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
