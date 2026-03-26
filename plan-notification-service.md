# Implementation Plan: Notification Service

**Ref**: ADR-001
**Target**: weolopez/aaron-test-repo

## Phase 1: Core Models (`src/models/notification.js`)
- Define Notification class with: id, type, userId, payload, channels, createdAt
- Define NotificationType enum: CRITICAL, HIGH, MEDIUM, LOW
- Define Channel enum: IN_APP, EMAIL, SMS
- Include factory function `createNotification(type, userId, payload)`
- Auto-generate UUID for notification ID

## Phase 2: Configuration (`src/config/notification-config.js`)
- Export channel configs (retry counts, latency thresholds)
- Export rate limit defaults (per-user, per-channel)
- Export retry parameters (base, multiplier, jitter, max)
- All values configurable via environment variables with sensible defaults

## Phase 3: Service Implementation (`src/services/notification.js`)
- `NotificationManager` class:
  - `send(notification)` — main entry point
  - `_route(notification)` — select channels based on type + preferences
  - `_enforceRateLimit(userId, channel)` — sliding window check
  - `_deliverWithRetry(notification, channel)` — retry wrapper
- `RetryEngine` class:
  - `execute(fn, config)` — run with exponential backoff
  - Configurable: base, multiplier, jitter, maxRetries
- Rate limiter: in-memory sliding window per user per channel

## Phase 4: Testing
- Unit tests for NotificationManager.send()
- Unit tests for RetryEngine exponential backoff timing
- Unit tests for rate limiter sliding window
- Integration test: send CRITICAL → verify all channels attempted

## Verification Checklist
- [ ] All files are valid ESM with no external dependencies
- [ ] CRITICAL notifications bypass rate limits
- [ ] Retry count matches per-type configuration
- [ ] Rate limiter enforces per-user and per-channel limits
- [ ] Graceful degradation: channel failure doesn't block others
