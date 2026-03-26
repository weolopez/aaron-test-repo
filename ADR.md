# Architectural Decision Records

## ADR-001: Notification Service Architecture

**Status**: Accepted
**Date**: 2026-03-26
**Context**: The system needs a notification service that delivers messages across
multiple channels with priority-based routing and retry logic.

### Decision

We will implement a **priority-queue-based notification dispatcher** with the following
architecture:

1. **NotificationManager** (orchestrator)
   - Accepts notification requests via `send(notification)`
   - Routes to appropriate channels based on type and user preferences
   - Enforces rate limits before dispatch

2. **Channel Adapters** (strategy pattern)
   - Each channel (in-app, email, SMS) implements a common `deliver(notification)` interface
   - Adapters are registered at startup and selected by the dispatcher

3. **RetryEngine** (exponential backoff)
   - Wraps channel delivery with configurable retry logic
   - Uses base interval, multiplier, jitter, and max-retries from notification type
   - Persists retry state for crash recovery

4. **PreferenceCache** (TTL-based in-memory cache)
   - Loads user preferences on first access
   - 5-minute TTL with lazy refresh
   - Filters notifications based on mute rules and quiet hours

5. **RateLimiter** (sliding window)
   - Per-user and per-channel sliding window counters
   - CRITICAL notifications bypass all limits
   - Returns `{ allowed: boolean, retryAfter: number }`

### Consequences
- Modular: channels can be added/removed without touching core logic
- Testable: each component has a clear interface boundary
- Trade-off: in-memory preference cache means stale data for up to 5 minutes

### Alternatives Considered
- **Event bus architecture**: More decoupled but harder to guarantee ordering
- **External queue (Redis/SQS)**: Better durability but violates zero-dependency constraint
