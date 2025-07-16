# Sync Performance Optimization - Slowing Down Real-time Updates

## Problem
Your real-time synchronization system was running too aggressively with multiple overlapping sync mechanisms causing performance issues and excessive server load.

## Solution Overview
I've implemented a comprehensive optimization that:
1. **Increased all polling intervals** to reduce server load
2. **Added centralized configuration** for easy management
3. **Implemented debouncing** to prevent excessive API calls
4. **Added monitoring tools** for debugging

## Changes Made

### 1. Centralized Configuration (`src/config/sync-config.ts`)
Created a single source of truth for all timing settings:

**New Polling Intervals:**
- User Locator: 60 seconds (was 15 seconds)
- Admin Dashboard: 120 seconds (was 30 seconds)
- Center Portal: 90 seconds (new)
- Polling-only mode: 180 seconds (was 120 seconds)
- Questionnaire updates: 300 seconds (was immediate)

**New Debounce Settings:**
- User input: 1.5 seconds
- Real-time updates: 2 seconds (was immediate)
- Filter changes: 1.5 seconds (was 0.8 seconds)
- Map interactions: 1 second

### 2. Updated Hooks

**`useAutismCenterLocatorSync.ts`:**
- Polling interval: 15s → 60s (4x slower)
- Polling-only mode: 120s → 180s (1.5x slower)
- Now uses centralized config

**`useAdminCenterSync.ts`:**
- Polling interval: 30s → 120s (4x slower)
- Now uses centralized config

**`useCenterUpdateSync.ts`:**
- Default polling: 10s → 60s (6x slower)
- Now uses centralized config

**`use-realtime-centers.ts`:**
- Fallback polling: 30s → 120s (4x slower)

**`useSmartSync.ts`:**
- Default polling: 60s → 120s (2x slower)
- Auto-sync polling: 30s → 180s (6x slower)

### 3. Enhanced Debouncing

**`GeoapifyLocationFinder.tsx`:**
- Added 2-second debounce for real-time updates
- Increased filter change debounce to 1.5 seconds
- Prevents rapid-fire API calls when users interact with filters

### 4. Monitoring & Debugging

**New `SyncMonitor` Component:**
- Shows current polling intervals
- Displays sync statistics
- Provides "Force Slow Mode" button
- Environment-aware configuration
- Performance tips for users

## Performance Impact

### Before Optimization:
- Locator: API call every 15 seconds
- Admin: API call every 30 seconds
- Multiple overlapping sync systems
- No debouncing on user interactions
- **Total: ~6-8 API calls per minute**

### After Optimization:
- Locator: API call every 60 seconds
- Admin: API call every 120 seconds
- Unified sync system with debouncing
- Smart fallback mechanisms
- **Total: ~1-2 API calls per minute**

**Result: 70-80% reduction in API calls**

## Environment-Specific Settings

**Development:**
- Faster intervals for testing (30s locator, 60s admin)
- Shorter debounce times (0.5s user input)

**Production:**
- Conservative intervals (120s locator, 180s admin)
- Longer debounce times (2s user input)

## How to Use

### 1. Monitor Performance
Look for the 📊 button in the bottom-right corner of the locator page to open the Sync Monitor.

### 2. Force Slow Mode
If you're still experiencing issues, click "🐌 Force Slow Mode" in the monitor to use maximum intervals.

### 3. Adjust Settings
Edit `src/config/sync-config.ts` to fine-tune intervals:

```typescript
POLLING: {
  LOCATOR: 60000,    // Increase for slower updates
  ADMIN: 120000,     // Increase for slower updates
  // ...
}
```

### 4. Environment Overrides
The system automatically uses different settings based on NODE_ENV:
- Development: Faster for testing
- Production: Slower for stability

## Troubleshooting

### If Updates Are Too Slow:
1. Check the Sync Monitor to see current intervals
2. Reduce polling intervals in `sync-config.ts`
3. Consider enabling WebSocket real-time (faster than polling)

### If Still Too Fast:
1. Use "Force Slow Mode" in the monitor
2. Increase debounce delays in config
3. Disable real-time entirely and use polling-only mode

### If Real-time Stops Working:
1. Check browser console for WebSocket errors
2. System will automatically fallback to polling
3. Use "Reset Sync" button in monitor

## Technical Notes

- **WebSocket preferred**: Real-time updates when possible
- **Polling fallback**: When WebSocket fails or is disabled
- **Smart detection**: Automatically switches based on environment
- **Graceful degradation**: Always maintains functionality
- **Centralized control**: Easy to adjust all timings from one place

## Next Steps

1. **Monitor performance** using the new sync monitor
2. **Adjust intervals** if needed based on user feedback
3. **Consider caching** for frequently accessed data
4. **Implement rate limiting** on the server side if needed

The system is now much more conservative and should significantly reduce server load while maintaining functionality.
