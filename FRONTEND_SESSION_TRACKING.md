# Frontend Session Tracking Implementation

## Overview
Implemented real-time meal plan generation progress UI with polling pattern and metrics dashboard.

## Implementation Date
Current session (Phase 5 of nutrition system enhancement)

## Files Created

### 1. useGenerationStatus.ts
**Purpose:** Custom React hook for polling generation status

**Key Features:**
- Polls `/api/v1/nutrition/generation/:sessionId/status` every 1000ms
- Automatically stops when phase === 'complete' or 'error'
- Cleanup interval on unmount
- onComplete and onError callbacks
- Returns: { status, isPolling, error }

**Exports:**
- `useGenerationStatus(options)` - Main hook
- `GenerationPhase` type
- `GenerationStatus` interface
- `GenerationSessionData` interface

### 2. GenerationProgress.tsx
**Purpose:** Real-time progress UI component

**Key Features:**
- Maps backend phases to user-friendly text:
  * initializing → "Preparing your plan..."
  * generating_days → "Building your 7-day plan... (X/7 days ready)"
  * auto_fixing → "Tuning portions and macros... (Y/7 adjusted)"
  * validating → "Double-checking macros..."
  * complete → Shows qualitySummary
- Animated progress bar (0-100%)
- Color-coded by phase (blue/amber/green/red)
- Quality breakdown on completion (first pass, scaled, regenerated, out of range)
- Spinner/checkmark/error icons

**Props:**
- `status: GenerationStatus | null`
- `isPolling: boolean`

### 3. CoachAccuracy.tsx
**Purpose:** Admin/dev metrics dashboard

**Key Features:**
- Fetches `/api/v1/nutrition/metrics` on mount
- Collapsible panel (click to expand)
- Shows:
  * Overall quality label: "Coach is dialed in ✨" (≥80%) / "Good performance" (60-79%) / "Prompts/config might need love ⚠️" (<60%)
  * First-pass quality rate (green/yellow/red color coding)
  * Auto-fix success rate
  * Regeneration success rate
  * Detailed breakdown: perfect, scaled, regenerated, out of range
- Auto-refresh every 30s when expanded
- Manual refresh button

**Color Thresholds:**
- Green: ≥80%
- Yellow: 60-79%
- Red: <60%

## Files Modified

### nutritionApiClient.ts
**Changes:**
- Updated `generateMealPlanForWeek()` return type from `WeeklyPlan` to `{ sessionId, weekStartDate, weeklyPlan?, qualitySummary? }`
- Response now includes sessionId for tracking

### NutritionPage.tsx
**Changes:**
1. Added imports:
   ```typescript
   import { useGenerationStatus } from './useGenerationStatus';
   import { GenerationProgress } from './GenerationProgress';
   import { CoachAccuracy } from './CoachAccuracy';
   ```

2. Added state:
   ```typescript
   const [generationSessionId, setGenerationSessionId] = useState<string | null>(null);
   ```

3. Added polling hook:
   ```typescript
   const { status, isPolling, error } = useGenerationStatus({
     sessionId: generationSessionId,
     onComplete: (status) => {
       loadWeeklyPlan();
       setTimeout(() => setGenerationSessionId(null), 3000);
     },
     onError: (err) => {
       setError({ message: err.message, retryable: true });
       setLoading(false);
       setGenerationSessionId(null);
     },
   });
   ```

4. Updated `handleGenerateWeek()`:
   - Captures `sessionId` from response
   - Sets `generationSessionId` state to trigger polling
   - Keeps loading state active during generation

5. Added UI components:
   - `<GenerationProgress />` after error display
   - `<CoachAccuracy />` at bottom of page

## User Flow

### 1. Generate Week Flow
1. User clicks "✨ Generate Week"
2. POST `/api/nutrition/plan/week` → returns `{ sessionId, weekStartDate }`
3. `generationSessionId` set → triggers polling
4. GenerationProgress displays "Preparing your plan..."
5. Poll every 1s → updates phase text:
   - "Building your 7-day plan... (3/7 days ready)"
   - "Tuning portions and macros... (5/7 adjusted)"
   - "Double-checking macros..."
6. Phase → 'complete':
   - Shows "Done! 4 perfect, 2 scaled, 1 regenerated"
   - Reloads weekly plan
   - Clears session after 3s

### 2. Metrics Dashboard Flow
1. User clicks "📊 Coach Accuracy" to expand
2. Fetches `/api/v1/nutrition/metrics`
3. Displays:
   - Overall quality: "Coach is dialed in ✨" (green 92%)
   - First Pass: 92% (64/70 days)
   - Auto-Fix: 88% (6 fixed)
   - Regen: 100% (0/0)
4. Auto-refreshes every 30s while expanded
5. Manual refresh button available

## API Integration

### Endpoints Used

**POST /api/nutrition/plan/week**
- Request: `{ weekStartDate, targets, userContext }`
- Response: `{ data: { sessionId, weekStartDate, qualitySummary? } }`

**GET /api/v1/nutrition/generation/:sessionId/status**
- Response: `{ data: { sessionId, userId, weekStartDate, createdAt, status: GenerationStatus } }`
- Status includes: phase, daysGenerated, daysAutoFixed, qualitySummary, etc.

**GET /api/v1/nutrition/metrics**
- Response: `{ data: NutritionMetrics }`
- Metrics include: totalWeeksGenerated, firstPassQuality, autoFix, regeneration rates

## Testing Checklist

### Manual Testing
- [ ] Click "Generate Week" → see "Preparing your plan..."
- [ ] Progress updates to "Building your 7-day plan... (X/7 days ready)"
- [ ] Progress bar animates smoothly
- [ ] Phase changes to auto-fixing with amber color
- [ ] Completion shows quality summary
- [ ] Weekly plan loads after completion
- [ ] Progress component disappears after 3s
- [ ] Error handling works (network failure, 404, etc.)
- [ ] Expand CoachAccuracy panel
- [ ] Metrics load correctly
- [ ] Color coding matches rates (green/yellow/red)
- [ ] Refresh button works
- [ ] Auto-refresh every 30s when expanded

### Edge Cases
- [ ] Server returns immediate plan (no sessionId) → fallback works
- [ ] Session not found (404) → error displayed
- [ ] Generation fails (error phase) → error UI shown
- [ ] Multiple rapid clicks on "Generate Week" → only one session active
- [ ] Component unmount during polling → cleanup prevents memory leak
- [ ] No metrics data yet → "No generation data yet" message

## Styling

All components use Tailwind CSS with slate color scheme matching existing UI:
- Background: `bg-slate-900`, `bg-slate-800`
- Borders: `border-slate-800`, `border-slate-700`
- Text: `text-slate-100`, `text-slate-300`, `text-slate-400`
- Accent colors: blue (generating), amber (fixing), green (success), red (error)

## Performance Considerations

1. **Polling Interval:** 1000ms (1s) - balance between responsiveness and server load
2. **Auto-cleanup:** Intervals cleared on unmount
3. **Session cleanup:** Backend should implement periodic cleanup of old sessions
4. **Metrics refresh:** Only when panel expanded, 30s interval
5. **Progress state:** Clears after 3s to avoid stale UI

## Future Enhancements

### Short-term
- [ ] Add nutrition profile selector (DEFAULT/STRICT/RELAXED → Balanced/Performance/Flexible)
- [ ] Show estimated time remaining based on phase
- [ ] Add sound/notification on completion
- [ ] Store sessionId in localStorage for page refresh recovery

### Long-term
- [ ] Replace polling with WebSocket/SSE for real-time push updates
- [ ] Add retry logic with exponential backoff
- [ ] Persist metrics to show historical trends (charts)
- [ ] Add "Cancel generation" button with DELETE endpoint
- [ ] Show live LLM reasoning/chain-of-thought during generation

## Related Documentation

- Backend Implementation: `backend/services/weeklyGenerationProgress.ts`
- API Routes: `backend/routes.ts` (lines 109-822)
- Testing: `backend/tests/nutrition.api.status-and-metrics.test.ts`
- Architecture: See IMPLEMENTATION_GUIDE.md Phase 5

## Notes

- All 22 backend tests passing before frontend implementation
- TypeScript errors fixed (NodeJS.Timeout → ReturnType<typeof setInterval>)
- Linting errors fixed (inline styles, unused imports)
- Backward compatible: Works with or without sessionId in response
- Mobile-friendly: Responsive design with Tailwind
