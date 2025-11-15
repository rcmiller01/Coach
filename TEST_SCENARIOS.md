# AI Workout Coach - Test Scenarios

**Version:** 1.0.0  
**Purpose:** Manual regression test suite for validating core workflows

These scenarios represent critical user paths. Run through them after major changes to ensure nothing breaks. Not formal automated tests—just explicit walkthroughs to verify expected behavior.

---

## Table of Contents

1. [New User Onboarding](#1-new-user-onboarding)
2. [Multi-Week Progression](#2-multi-week-progression)
3. [Block Transitions](#3-block-transitions)
4. [Goal Changes](#4-goal-changes)
5. [Diet & Food Logging](#5-diet--food-logging)
6. [Today Hub](#6-today-hub)
7. [Backup & Reset](#7-backup--reset)
8. [Diagnostics](#8-diagnostics)
9. [Edge Cases](#9-edge-cases)

---

## 1. New User Onboarding

### Scenario 1A: Strength-Focused Beginner

**Steps:**
1. Open app (should see onboarding wizard)
2. Click "Let's start"
3. Enter profile:
   - Age: 28
   - Height: 5'10" (178cm)
   - Weight: 165 lbs (75kg)
   - Training experience: Beginner
4. Select goal: "Get Stronger"
5. Enter motivation: "Want to lift heavier than my friends at the gym"
6. Constraints: Check "Knees" (Mild)
7. Environment: Gym
8. Equipment: Select Barbell, Dumbbell, Bodyweight
9. Schedule: 3 sessions/week, Mon/Wed/Fri, Morning
10. Review summary, click "Create my first week"

**Expected Results:**
- ✓ Program generated with 3 training days
- ✓ Week 1 shown in ProgramWeekView
- ✓ Block 1 badge shows "Strength"
- ✓ Exercises have 4×3-5 rep scheme (strength focus)
- ✓ Diet targets calculated and shown (small surplus ~+5%)
- ✓ Today Hub shows today's session (if Mon/Wed/Fri) or rest day
- ✓ Diagnostics show "No issues detected"

**Verify:**
- Check `coach-profile` in localStorage contains all inputs
- Check `coach-multi-week-program` has `blocks[0].goal === 'strength'`
- Check `coach-diet-targets` exists with ~2400-2600 kcal

---

### Scenario 1B: Hypertrophy-Focused Intermediate

**Steps:**
1. Clear localStorage (reset everything)
2. Complete onboarding:
   - Age: 32, Height: 5'8", Weight: 180 lbs
   - Experience: Intermediate
   - Goal: "Build Muscle"
   - Motivation: "Want to look good for summer"
   - No constraints
   - Home gym with dumbbells and resistance bands
   - 4 sessions/week, rotating days

**Expected Results:**
- ✓ Exercises have 4×6-10 rep scheme (hypertrophy focus)
- ✓ Diet targets show +10% surplus (~2800-3000 kcal)
- ✓ Block goal is "Hypertrophy"
- ✓ Equipment filters prevent barbell exercises

---

## 2. Multi-Week Progression

### Scenario 2A: 4-Week Build Cycle

**Prerequisite:** Complete Scenario 1A (strength program)

**Steps:**
1. Start Monday's session
2. Log all exercises:
   - Set weights ~70% of typical max
   - All sets: 5 reps, RPE 7
3. Complete session
4. Check Today Hub next day (Tuesday) → should show "Rest day"
5. Complete Wednesday and Friday sessions similarly
6. End of Week 1: Click "New Week" button

**Week 2-4:**
7. Repeat weekly cycle
8. Gradually increase weights (+5-10 lbs per week)
9. Keep RPE 7-8
10. After Week 4, check "Weekly Dashboard" and "Coach Insights"

**Expected Results:**
- ✓ Load suggestions increase each week (due to RPE ≥ 8)
- ✓ Actual loads tracked in "Weekly Progress Summary"
- ✓ Coach Insights show positive feedback for consistency
- ✓ After 4 weeks, block still active (`endWeekIndex = null`)

**Verify in DevTools:**
```javascript
// Check history length
JSON.parse(localStorage.getItem('ai_coach_workout_history')).length === 12 // 3 sessions × 4 weeks
```

---

### Scenario 2B: Deload Week Trigger

**Prerequisite:** Scenario 2A completed (4 build weeks)

**Steps:**
1. Week 5: Notice week header shows "Build" phase
2. Program should auto-suggest or enforce deload after 4 hard weeks
3. Check exercises: sets should remain same, but loads reduced by 40-50%
4. Log deload week with lighter weights, RPE 5-6
5. Complete deload week, click "New Week"

**Expected Results:**
- ✓ Week 5 badge shows "Deload" phase
- ✓ Suggested loads are 40-50% lower than Week 4
- ✓ Coach Insights recommend "active recovery"
- ✓ After deload, Block 1 auto-closes (`endWeekIndex = 4`)

**Verify:**
```javascript
const program = JSON.parse(localStorage.getItem('coach-multi-week-program'));
program.blocks[0].endWeekIndex === 4 // Block 1 closed after Week 5
program.blocks.length === 2 // New block created
```

---

## 3. Block Transitions

### Scenario 3A: Automatic Block Close + Recommendation

**Prerequisite:** Scenario 2B completed (deload week done)

**Steps:**
1. After Week 5 (deload) completion, check ProgramWeekView
2. Look for "View Block Summary" button for Block 1
3. Click it, review block summary:
   - Total weeks: 5
   - Adherence %
   - Average RPE
   - Volume progression
4. Check recommendation section

**Expected Results:**
- ✓ Block Summary shows all 5 weeks aggregated
- ✓ Recommendation suggests next block goal (likely "Hypertrophy" after strength)
- ✓ Reason provided (e.g., "Good adherence, time for volume phase")
- ✓ Week 6 starts with new Block 2
- ✓ Block 2 has different goal (Hypertrophy)

**Verify:**
```javascript
const program = JSON.parse(localStorage.getItem('coach-multi-week-program'));
program.blocks[1].goal === 'hypertrophy'
program.blocks[1].startWeekIndex === 5
```

---

### Scenario 3B: Manual Block Goal Override

**Prerequisite:** Block 2 (Hypertrophy) started

**Steps:**
1. Week 6: User decides they want to focus on strength again
2. (For now, this requires localStorage editing—future feature)
3. Manually edit block goal:
   ```javascript
   const program = JSON.parse(localStorage.getItem('coach-multi-week-program'));
   program.blocks[1].goal = 'strength';
   localStorage.setItem('coach-multi-week-program', JSON.stringify(program));
   ```
4. Refresh page
5. Generate new week

**Expected Results:**
- ✓ New weeks use strength sets/reps (4×3-5)
- ✓ Progression engine uses strength RPE thresholds (≥8)
- ✓ Diet targets recalculated for strength (+5% vs +10%)

---

## 4. Goal Changes

### Scenario 4A: Strength → Hypertrophy Transition

**Setup:**
1. Complete 4-week strength block + deload
2. System recommends hypertrophy block
3. Accept recommendation, start Week 6

**Test Points:**

**A. Sets/Reps Change:**
- Strength: Squat 4×3-5 @ heavy weight
- Hypertrophy: Squat 4×6-10 @ moderate weight
- ✓ Verify rep ranges updated

**B. Progression Behavior:**
- Strength: Increase load if RPE ≥ 8
- Hypertrophy: Increase load if RPE ≥ 7.5
- ✓ Log Week 6 session with RPE 7.8
- ✓ Week 7 should show load increase

**C. Diet Targets:**
- Strength: +5% surplus (~2450 kcal)
- Hypertrophy: +10% surplus (~2550 kcal)
- ✓ Check DietSummary shows higher target

**D. Coach Insights Tone:**
- Strength: Focus on "power" and "strength gains"
- Hypertrophy: Focus on "volume" and "muscle growth"
- ✓ Check Weekly Dashboard insights match goal

---

### Scenario 4B: Return to Training Mode

**Setup:**
1. User had injury/long break
2. Reset program data (keep profile)
3. Create new program with "General" goal
4. After 2 weeks, switch to "Return to Training"

**Expected Behavior:**
- ✓ Sets/reps: 2×8-10 (very conservative)
- ✓ RPE threshold: ≥6 (easier progression trigger)
- ✓ Load increments: +1-2% (small jumps)
- ✓ Diet: Maintenance calories
- ✓ Coach Insights emphasize "movement quality" over "load"

---

## 5. Diet & Food Logging

### Scenario 5A: Daily Food Tracking

**Steps:**
1. Navigate to Today Hub
2. Diet Today panel shows:
   - Target: 2500 kcal, 135g P, 312g C, 69g F
   - Logged: 0 kcal (no entries yet)
3. Add breakfast:
   - 450 kcal, 30g P, 50g C, 15g F
   - Click "Add"
4. Add lunch:
   - 600 kcal, 40g P, 70g C, 20g F
5. Add dinner:
   - 700 kcal, 45g P, 80g C, 25g F
6. Add snack:
   - 250 kcal, 20g P, 20g C, 10g F

**Expected Results:**
- ✓ Total logged updates in real-time
- ✓ Progress bars fill up (2000/2500 = 80%)
- ✓ Remaining shows: 500 kcal, 0g P (over), 92g C, -1g F
- ✓ Protein bar turns green (≥95% of target)
- ✓ Overall bar stays blue (< 95%)

**Verify:**
```javascript
const foodLog = JSON.parse(localStorage.getItem('ai_coach_food_log_v1'));
const today = new Date().toISOString().split('T')[0];
foodLog[today].calories === 2000
```

---

### Scenario 5B: Food Logging Without Diet Targets

**Steps:**
1. Reset program data (clears diet targets)
2. Go to Today Hub
3. Add food entry: 500 kcal, 25g P, 60g C, 15g F

**Expected Results:**
- ✓ Food log stores entry
- ✓ Diagnostics show INFO: "You have 1 days of food logs but no diet targets. Consider setting up diet targets to track progress."
- ✓ Today Hub shows food log but no progress bars (no target to compare)

---

## 6. Today Hub

### Scenario 6A: Training Day

**Setup:** Monday, user has Monday workout scheduled

**Steps:**
1. Open app (defaults to Today Hub)
2. Check date matches today
3. Training Today card shows:
   - Session name (e.g., "Upper Body")
   - Week context (Week 2, Build, Strength)
   - Status: "Not started yet"
   - Exercise preview (first 4 exercises)
4. Click "Start Session"

**Expected Results:**
- ✓ Transitions to WorkoutSessionView
- ✓ Same session as clicking from Program view
- ✓ After completion, Today Hub shows "✓ Completed: 9/9 sets, avg RPE 7.4"

---

### Scenario 6B: Rest Day

**Setup:** Tuesday, no workout scheduled

**Steps:**
1. Navigate to Today Hub
2. Check Training Today card

**Expected Results:**
- ✓ Shows "No training scheduled for today"
- ✓ Subtext: "Rest day or off-schedule day"
- ✓ No "Start Session" button
- ✓ Diet Today panel still functional

---

### Scenario 6C: Session Already Completed

**Setup:** Complete Monday workout, check Today Hub on same day

**Expected Results:**
- ✓ Status changes from "Not started" to "✓ Completed"
- ✓ Shows set count and average RPE
- ✓ "Start Session" button hidden or disabled
- ✓ Green success styling on completion card

---

## 7. Backup & Reset

### Scenario 7A: Export Training Data

**Steps:**
1. Go to Settings → Backup & Export
2. Click "📥 Download Backup"
3. Check Downloads folder for `coach-backup-YYYY-MM-DD.json`
4. Open file in text editor

**Expected Contents:**
```json
{
  "version": "1.0.0",
  "exportedAt": "2025-11-15T...",
  "program": { /* ProgramMultiWeek */ },
  "history": [ /* WorkoutHistoryEntry[] */ ],
  "dietTargets": { /* DietTargets */ },
  "nutritionTargets": { /* NutritionTargets */ },
  "foodLog": { /* date → DailyFoodTotals */ }
}
```

**Alternative:**
5. Click "📋 Copy to Clipboard"
6. Paste into text editor
7. Verify same JSON structure

**Expected Results:**
- ✓ File downloads successfully
- ✓ JSON is valid and readable
- ✓ Contains all program weeks, history entries, diet data
- ✓ Success message: "✓ Backup downloaded successfully!"

---

### Scenario 7B: Reset Program Data

**Steps:**
1. Settings → Backup & Export
2. Note current data: "8 weeks, 2 blocks, 24 workouts, 5 food days"
3. Click "🔄 Reset Program Data"
4. Modal appears with detailed summary
5. Click "Reset Program" (confirm)

**Expected Results:**
- ✓ Modal shows exactly what will be deleted
- ✓ Warns "Your onboarding profile will be preserved"
- ✓ After confirm, page reloads
- ✓ Today Hub shows no session (no program)
- ✓ Settings still has onboarding profile
- ✓ Can regenerate program from profile

**Verify:**
```javascript
localStorage.getItem('coach-multi-week-program') === null
localStorage.getItem('ai_coach_workout_history') === null
localStorage.getItem('coach-profile') !== null // Preserved!
```

---

### Scenario 7C: Reset Everything

**Steps:**
1. Settings → Backup & Export
2. Click "Reset Everything" (red button)
3. Confirm in browser dialog
4. Page reloads

**Expected Results:**
- ✓ App shows onboarding wizard again
- ✓ All localStorage cleared (including profile)
- ✓ Fresh start

---

## 8. Diagnostics

### Scenario 8A: Clean State - No Issues

**Setup:** Fresh program, normal progression

**Steps:**
1. Go to Settings
2. Check "Developer Diagnostics" panel

**Expected Results:**
- ✓ Summary shows correct counts
- ✓ Green "✅ No issues detected" message
- ✓ "All integrity checks passed successfully"

---

### Scenario 8B: Detect Invalid Week Index

**Setup:** Manually corrupt program state

**Steps:**
1. In browser DevTools console:
   ```javascript
   const program = JSON.parse(localStorage.getItem('coach-multi-week-program'));
   program.currentWeekIndex = 999; // Invalid!
   localStorage.setItem('coach-multi-week-program', JSON.stringify(program));
   ```
2. Refresh page
3. Go to Settings → Developer Diagnostics

**Expected Results:**
- ✓ Shows 1 ERROR
- ✓ Message: "Current week index (999) is out of bounds. Valid range: 0-7"
- ✓ Red error badge with ❌ icon

---

### Scenario 8C: Overlapping Blocks

**Setup:**
```javascript
const program = JSON.parse(localStorage.getItem('coach-multi-week-program'));
program.blocks = [
  { id: 'b1', startWeekIndex: 0, endWeekIndex: 3, goal: 'strength' },
  { id: 'b2', startWeekIndex: 2, endWeekIndex: 5, goal: 'hypertrophy' } // Overlaps!
];
localStorage.setItem('coach-multi-week-program', JSON.stringify(program));
```

**Expected Results:**
- ✓ ERROR: "Week 3 belongs to both Block 1 and Block 2. Blocks must not overlap."
- ✓ ERROR: "Week 4 belongs to both Block 1 and Block 2. Blocks must not overlap."

---

### Scenario 8D: Missing Diet Targets

**Setup:**
1. Complete onboarding, generate program
2. Manually delete diet targets:
   ```javascript
   localStorage.removeItem('coach-diet-targets');
   ```
3. Refresh, check diagnostics

**Expected Results:**
- ✓ WARNING: "Program exists but no diet targets calculated. Consider recalculating diet targets from your profile."
- ✓ Yellow warning badge with ⚠️ icon

---

## 9. Edge Cases

### Scenario 9A: Zero Training Days in Week

**Setup:**
```javascript
const program = JSON.parse(localStorage.getItem('coach-multi-week-program'));
program.weeks[0].days = []; // No days!
localStorage.setItem('coach-multi-week-program', JSON.stringify(program));
```

**Expected Results:**
- ✓ Diagnostics WARNING: "Week 1 has no training days defined."
- ✓ App doesn't crash
- ✓ "New Week" button still works

---

### Scenario 9B: Exercise with Zero Sets

**Setup:**
```javascript
const program = JSON.parse(localStorage.getItem('coach-multi-week-program'));
program.weeks[0].days[0].exercises[0].sets = 0;
localStorage.setItem('coach-multi-week-program', JSON.stringify(program));
```

**Expected Results:**
- ✓ WorkoutSessionView shows exercise but no set UI
- ✓ Can complete session (skip invalid exercise)
- ✓ No crash

---

### Scenario 9C: Food Log with Negative Values

**Steps:**
1. Manually enter negative food values in DevTools
2. Check DietTodayPanel

**Expected Results:**
- ✓ App handles gracefully (shows negative or clamps to 0)
- ✓ No crash
- ✓ Progress bars don't break

---

### Scenario 9D: Browser Storage Quota Exceeded

**Simulation:**
1. Fill localStorage with dummy data until quota warning
2. Try to complete a workout session

**Expected Results:**
- ✓ Error caught and logged
- ✓ User sees error message (can't save)
- ✓ Suggests clearing history or exporting backup

---

## Test Matrix Summary

| Scenario | Priority | Frequency |
|----------|----------|-----------|
| 1A: New User Onboarding (Strength) | 🔴 Critical | Every release |
| 1B: New User Onboarding (Hypertrophy) | 🔴 Critical | Every release |
| 2A: 4-Week Build Cycle | 🔴 Critical | Every release |
| 2B: Deload Week Trigger | 🔴 Critical | Every release |
| 3A: Block Transition | 🔴 Critical | Every release |
| 3B: Manual Goal Override | 🟡 Medium | Major changes |
| 4A: Goal Change (Strength → Hypertrophy) | 🔴 Critical | Every release |
| 4B: Return to Training Mode | 🟡 Medium | As needed |
| 5A: Daily Food Tracking | 🟡 Medium | Diet changes |
| 5B: Food Log Without Targets | 🟢 Low | As needed |
| 6A-6C: Today Hub Variants | 🔴 Critical | Every release |
| 7A: Export Backup | 🔴 Critical | Every release |
| 7B: Reset Program | 🔴 Critical | Every release |
| 7C: Reset Everything | 🟡 Medium | Major changes |
| 8A-8D: Diagnostics | 🟡 Medium | Diagnostic changes |
| 9A-9D: Edge Cases | 🟢 Low | Edge case fixes |

---

## Quick Smoke Test (5 minutes)

**Minimal regression check before deploying:**

1. ✓ Fresh onboarding → program generated
2. ✓ Start a workout → log sets → complete
3. ✓ Today Hub shows session + diet panel
4. ✓ Add food entry → progress bar updates
5. ✓ Settings diagnostics show no errors
6. ✓ Export backup → JSON valid
7. ✓ Reset program → profile preserved

If all pass, basic functionality intact.

---

**End of Test Scenarios**
