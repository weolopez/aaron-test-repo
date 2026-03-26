# Requirements: User Notification Service

## 1. Overview

The system requires a **User Notification Service** that delivers real-time and batched
notifications across multiple channels (in-app, email, SMS). The service must support
priority-based routing, retry with exponential backoff, user preference filtering,
and rate limiting per channel.

## 2. Functional Requirements

### 2.1 Notification Types
| Type        | Channels         | Max Latency | Retry |
|-------------|------------------|-------------|-------|
| CRITICAL    | All channels     | 1s          | 5     |
| HIGH        | In-app + Email   | 5s          | 3     |
| MEDIUM      | In-app           | 30s         | 2     |
| LOW         | In-app (batched) | 5m          | 1     |

### 2.2 Channel Configuration
- **In-app**: WebSocket push with localStorage fallback
- **Email**: SMTP via configurable provider (SendGrid, SES, Mailgun)
- **SMS**: Twilio API with per-region routing

### 2.3 User Preferences
- Users can mute specific notification types
- Users can set quiet hours (no non-CRITICAL notifications)
- Users can choose preferred channel per notification type
- Preferences stored in user profile, cached in memory with 5m TTL

### 2.4 Rate Limiting
- Per-user: max 10 notifications/minute, max 100/hour
- Per-channel: configurable limits (e.g., SMS max 5/hour per user)
- CRITICAL notifications bypass rate limits

### 2.5 Retry Logic
- Exponential backoff: base 1s, multiplier 2x, jitter ±500ms
- Max retries per notification type (see table above)
- Dead letter queue for exhausted retries
- Retry state persisted for crash recovery

## 3. Non-Functional Requirements

### 3.1 Performance
- P99 latency for CRITICAL notifications: < 500ms
- Throughput: 10,000 notifications/second sustained
- Memory footprint: < 256MB for preference cache

### 3.2 Reliability
- At-least-once delivery guarantee
- Idempotent delivery (dedup by notification ID + channel)
- Graceful degradation: if one channel fails, others continue

### 3.3 Observability
- Structured logging with correlation IDs
- Metrics: delivery rate, failure rate, latency percentiles per channel
- Alerting on: delivery failure rate > 5%, latency P99 > 2x threshold

## 4. Constraints
- Must be pure JavaScript (ESM, no TypeScript)
- Zero external runtime dependencies (use native fetch, crypto, etc.)
- Must work in both Node.js 18+ and modern browsers
- Configuration via environment variables, no config files at runtime
