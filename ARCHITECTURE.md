# AI Workout Coach - System Architecture

**Version:** 1.0.0  
**Last Updated:** November 2025

This document provides a comprehensive overview of the application architecture, core domains, state management, and decision logic. Use this as the primary reference for understanding the system or planning future enhancements (e.g., mobile port, backend integration).

---

## Table of Contents

1. [Core Domains](#core-domains)
2. [Main State Objects](#main-state-objects)
3. [Decision Logic & Rules](#decision-logic--rules)
4. [Data Flow](#data-flow)
5. [Storage Strategy](#storage-strategy)
6. [Key Architectural Principles](#key-architectural-principles)

---

## Core Domains

The application is organized into six primary domains:

### 1. **Onboarding**
**Purpose:** Collect user profile data to generate personalized training programs.

**Location:** `src/features/onboarding/`

**Key Components:**
- `OnboardingWizard.tsx` - Multi-step wizard orchestrator
- `types.ts` - `OnboardingState` type with all user inputs
- Individual step components (Welcome, BasicProfile, GoalMotivation, etc.)

**Collects:**
- Demographics: age, height, weight
- Training experience level
- Primary goal (lose fat, build muscle, get stronger, etc.)
- Motivation (140-char user "why")
- Joint/injury constraints
- Training environment & equipment
- Weekly schedule (sessions/week, preferred days/times)

**Output:** Saved to localStorage as `coach-profile`, used to generate initial `ProgramMultiWeek`.

---

### 2. **Training Program**
**Purpose:** Generate, manage, and track multi-week training programs with periodization.

**Location:** `src/features/program/`

**Key Components:**
- `programGenerator.ts` - Initial program generation from onboarding
- `programStorage.ts` - localStorage persistence
- `weekRenewal.ts` - New week generation + block transitions
- `types.ts` - Core types (`ProgramWeek`, `ProgramDay`, `ProgramExercise`, `TrainingBlock`)

**Core Concepts:**
- **ProgramMultiWeek:** Container for all weeks, current week index, and blocks
- **ProgramWeek:** 7 days, focus, training phase (build/deload)
- **ProgramDay:** Exercises for a specific weekday
- **TrainingBlock (Mesocycle):** Spans multiple weeks with a specific `BlockGoal`

**Block Goals:**
- `strength` - Lower reps (3-5), higher intensity
- `hypertrophy` - Moderate reps (6-10), volume focus
- `general` - Balanced approach
- `return_to_training` - Conservative loads, movement restoration

**Phases:**
- `build` - Progressive overload weeks
- `deload` - Recovery week (reduced volume/intensity)

---

### 3. **Blocks & Periodization**
**Purpose:** Organize training into mesocycles with goal-specific progression.

**Location:** `src/features/program/`

**Key Files:**
- `types.ts` - `TrainingBlock`, `BlockGoal`
- `weekRenewal.ts` - Block creation and auto-transition logic
- `blockRecommendations.ts` - "What next?" recommendation engine
- `BlockSummary.tsx` - Aggregated block performance view

**Block Lifecycle:**
1. **Created:** New block starts with `startWeekIndex`, `endWeekIndex = null`, goal
2. **Active:** User progresses through weeks, logging workouts
3. **Auto-Close:** After ≥4 weeks + deload week, `endWeekIndex` set
4. **Next Block:** Recommendation shown, new block created with updated goal if needed

**Recommendations:**
- Advance to next goal (e.g., strength → hypertrophy)
- Repeat current goal (if adherence was low)
- Adjust volume/intensity

---

### 4. **Workout Execution & History**
**Purpose:** Track live workout sessions and maintain historical performance data.

**Location:** 
- Workout: `src/features/workout/`
- History: `src/features/history/`

**Key Components:**
- `WorkoutSessionView.tsx` - Live workout UI with rest timers, RPE tracking
- `historyStorage.ts` - Persistent workout logs
- `types.ts` (history) - `WorkoutHistoryEntry`

**Workout Flow:**
1. User starts a `ProgramDay` from week view or Today hub
2. For each exercise, user logs sets (weight, reps, RPE)
3. Optional: Camera-based pose detection for form feedback
4. On completion, saved to `WorkoutHistoryEntry`

**History Powers:**
- Actual load tracking (`actualLoads.ts`)
- Weekly adherence calculations (`weeklyAdherence.ts`)
- Coach insights generation (`coachInsights.ts`)
- Block summary aggregations

---

### 5. **Diet & Nutrition**
**Purpose:** Calculate daily calorie/macro targets aligned with training goals.

**Location:** `src/features/nutrition/`

**Key Files:**
- `dietEngine.ts` - BMR/TDEE calculations, goal-based adjustments
- `userStatsConverter.ts` - Onboarding → UserStats conversion
- `dietStorage.ts` - Persist diet targets
- `foodLog.ts` - Daily food logging
- `DietSummary.tsx`, `DietTodayPanel.tsx` - UI components

**Diet Calculation:**
1. **BMR** (Mifflin-St Jeor): `(10 × weight_kg) + (6.25 × height_cm) - (5 × age) + sex_constant`
2. **TDEE** = BMR × activity multiplier (1.2-1.725)
3. **Goal Adjustment:**
   - Strength: +5% (small surplus)
   - Hypertrophy: +10% (moderate surplus)
   - General/RTT: maintenance
4. **Macros:**
   - Protein: 1.8g/kg body weight
   - Fats: 25% of total calories
   - Carbs: Remainder

**Food Logging:**
- Simple numeric entry: calories, protein, carbs, fats
- Aggregates to `DailyFoodTotals` per date
- Stored in `ai_coach_food_log_v1` localStorage key

---

### 6. **Today Hub**
**Purpose:** Daily dashboard combining training + diet at a glance.

**Location:** `src/features/today/`

**Key Component:** `TodayHub.tsx`

**Displays:**
- **Training Today Card:**
  - Scheduled session (matched by day of week)
  - Week context (week #, phase, block goal)
  - Completion status
  - Quick "Start Session" button
  
- **Diet Today Card:**
  - Target vs. logged vs. remaining (calories + macros)
  - Progress bars with color coding
  - Quick food entry form

**Smart Session Detection:**
- Matches current weekday to `ProgramDay.dayOfWeek`
- Shows "Rest day" if no match
- Detects completion via history entries

---

## Main State Objects

### `OnboardingState`
**Location:** `src/features/onboarding/types.ts`

```typescript
interface OnboardingState {
  age: number;
  heightCm: number;
  weightKg: number;
  trainingExperience: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: PrimaryGoal;
  motivation: { text: string }; // max 140 chars
  jointIssues: JointIssue[];
  trainingEnvironment: 'gym' | 'home' | 'outdoors' | 'mix';
  equipment: string[];
  sessionsPerWeek: number;
  preferredDays: string[];
  preferredTimeOfDay: 'morning' | 'midday' | 'evening' | 'varies';
}
```

**Stored:** `coach-profile` localStorage key  
**Used For:** Initial program generation, diet calculation, regenerating after reset

---

### `ProgramMultiWeek`
**Location:** `src/features/program/types.ts`

```typescript
interface ProgramMultiWeek {
  currentWeekIndex: number;  // 0-based index
  weeks: ProgramWeek[];      // All generated weeks
  blocks: TrainingBlock[];   // Mesocycle blocks
}
```

**Stored:** `coach-multi-week-program` localStorage key  
**Contains:** Entire training history (past + current + future weeks)

---

### `TrainingBlock`
**Location:** `src/features/program/types.ts`

```typescript
interface TrainingBlock {
  id: string;
  startWeekIndex: number;
  endWeekIndex: number | null;  // null = active block
  goal: BlockGoal;
  createdAt: string;
}
```

**Lifecycle:**
- Active blocks have `endWeekIndex = null`
- Closed after ≥4 weeks + deload
- New blocks created via `weekRenewal.ts`

---

### `WorkoutHistoryEntry`
**Location:** `src/features/history/types.ts`

```typescript
interface WorkoutHistoryEntry {
  id: string;
  completedAt: string;          // ISO timestamp
  programDayId: string;
  dayOfWeek: string;
  focus: ProgramDayFocus;
  exercises: {
    exerciseId: string;
    name: string;
    sets: WorkoutSetState[];    // { weight, reps, rpe }
  }[];
}
```

**Stored:** `ai_coach_workout_history` localStorage key  
**Used For:** Progression engine, insights, block summaries, adherence tracking

---

### `DietTargets`
**Location:** `src/features/nutrition/dietEngine.ts`

```typescript
interface DietTargets {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  label: string;  // e.g., "Small surplus for strength-focused training"
}
```

**Stored:** `coach-diet-targets` localStorage key  
**Recalculated:** When onboarding completes or block goal changes

---

### `DailyFoodTotals`
**Location:** `src/features/nutrition/foodLog.ts`

```typescript
interface DailyFoodTotals {
  date: string;  // YYYY-MM-DD
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}
```

**Stored:** `ai_coach_food_log_v1` (map of date → totals)  
**Updated:** Via FoodQuickEntry component

---

## Decision Logic & Rules

### Progression Rules
**Location:** `src/features/progression/progressionEngine.ts`

**Function:** `getLoadSuggestionsForExercises()`

**Logic:**
1. Get actual loads from previous week
2. Check RPE thresholds (goal-specific):
   - Strength: RPE ≥ 8 → increase load
   - Hypertrophy: RPE ≥ 7.5 → increase load
   - General: RPE ≥ 7 → increase load
   - RTT: RPE ≥ 6 → increase load
3. Calculate increment (goal-specific):
   - Strength: +2.5-5% for compounds, +2.5% for accessories
   - Hypertrophy: +2.5% across the board
   - General: +2.5%
   - RTT: +1-2% (conservative)
4. Return load suggestions for next session

**Deload Handling:** During deload weeks, reduce loads by 40-50%

---

### Goal-Aware Program Generation
**Location:** `src/features/program/programGenerator.ts`

**Function:** `generateInitialProgram()`

**Sets/Reps by Goal:**
- **Strength:** 4 × 3-5 (heavy compounds), 3 × 6-8 (accessories)
- **Hypertrophy:** 4 × 6-10 (moderate weight, higher volume)
- **General:** 3 × 6-10 (balanced)
- **Return to Training:** 2 × 8-10 (low intensity, movement focus)

**Exercise Selection:**
- Filtered by available equipment
- Prioritized by movement pattern (squat, hinge, push, pull)
- Adjusted for joint constraints

---

### Block Transition Rules
**Location:** `src/features/program/weekRenewal.ts`

**Function:** `generateNextWeekAndBlock()`

**Auto-Close Logic:**
```
IF current_block.duration >= 4 weeks AND last_week_was_deload:
  SET current_block.endWeekIndex = currentWeekIndex
  GENERATE next_block with recommended goal
```

**Next Block Goal:**
- Based on `blockRecommendations.ts`
- Considers adherence, RPE patterns, volume progression
- Default cycle: strength → hypertrophy → general

---

### Coach Insights Generation
**Location:** `src/features/program/coachInsights.ts`

**Function:** `generateCoachInsights()`

**Input:** Week adherence, stress levels, key lift performance

**Rules:**
1. **Adherence-based:**
   - Low adherence (< 50%) → suggest recovery or scheduling adjustment
   - Perfect adherence → encourage consistency
   
2. **Stress-based:**
   - High stress (lots of high RPE sets) → suggest deload or intensity reduction
   - Low stress → suggest pushing harder next week
   
3. **Performance-based:**
   - Key lifts progressing → positive reinforcement
   - Stalled lifts → technique focus or deload suggestion

**Output:** Array of `CoachInsight` with priority levels

---

### Block Recommendations
**Location:** `src/features/program/blockRecommendations.ts`

**Function:** `recommendNextBlock()`

**Inputs:** Block summary (adherence, volume, RPE trends)

**Decision Tree:**
```
IF adherence < 60%:
  RECOMMEND: Repeat current goal (consistency focus)
ELSE IF avg_rpe > 8.5 across all weeks:
  RECOMMEND: Return to training (recovery needed)
ELSE IF current_goal == strength:
  RECOMMEND: Hypertrophy (muscle building phase)
ELSE IF current_goal == hypertrophy:
  RECOMMEND: General (maintain + recalibrate)
ELSE:
  RECOMMEND: Strength (build peak force)
```

---

### Diet Calculation Rules
**Location:** `src/features/nutrition/dietEngine.ts`

**Function:** `calculateDietTargets()`

**BMR Formula (Mifflin-St Jeor):**
```
Men:    (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
Women:  (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
Other:  Average of male/female formulas
```

**Activity Multipliers:**
- Sedentary (1-2 sessions/week): 1.2
- Light (3 sessions/week): 1.375
- Moderate (4-5 sessions/week): 1.55
- High (6+ sessions/week): 1.725

**Goal Adjustments:**
- Strength: TDEE × 1.05 (small surplus)
- Hypertrophy: TDEE × 1.10 (moderate surplus)
- General/RTT: TDEE × 1.0 (maintenance)

**Macro Split:**
1. Protein: 1.8g/kg (optimal for muscle protein synthesis)
2. Fats: 25% of total calories
3. Carbs: Remaining calories

---

## Data Flow

### 1. New User Onboarding
```
User Input → OnboardingWizard
  ↓
OnboardingState saved to localStorage (coach-profile)
  ↓
generateInitialProgram() creates ProgramMultiWeek
  ↓
calculateDietTargets() creates DietTargets
  ↓
User sees Today Hub (first session + diet)
```

### 2. Workout Completion
```
User starts ProgramDay → WorkoutSessionView
  ↓
Logs sets (weight, reps, RPE) → WorkoutSetState[]
  ↓
On complete → WorkoutHistoryEntry saved
  ↓
progressionEngine calculates next session loads
  ↓
weeklyAdherence + coachInsights update
```

### 3. Week Renewal
```
User clicks "New Week" → handleRenewWeek()
  ↓
weekRenewal.generateNextWeekAndBlock()
  ↓
Check: Should block close? (≥4 weeks + deload)
  ↓
IF yes:
  - Close current block (set endWeekIndex)
  - Generate recommendation
  - Create new block with recommended goal
  ↓
Generate new ProgramWeek with goal-aware sets/reps
  ↓
Append to ProgramMultiWeek, increment currentWeekIndex
```

### 4. Food Logging
```
User enters food → FoodQuickEntry
  ↓
addFoodEntry() updates DailyFoodTotals
  ↓
DietTodayPanel re-renders with new progress
  ↓
Visual feedback (progress bars, remaining macros)
```

---

## Storage Strategy

All data persists to **localStorage** with specific keys:

| Key | Type | Purpose |
|-----|------|---------|
| `coach-profile` | `OnboardingState` | User profile & preferences |
| `coach-multi-week-program` | `ProgramMultiWeek` | All training weeks + blocks |
| `ai_coach_workout_history` | `WorkoutHistoryEntry[]` | Completed sessions |
| `coach-diet-targets` | `DietTargets` | Current calorie/macro targets |
| `coach-nutrition-targets` | `NutritionTargets` | Legacy nutrition data |
| `ai_coach_food_log_v1` | `Record<date, DailyFoodTotals>` | Daily food logs |
| `coach-meal-plan` | `DailyMealPlan` | Generated meal plans |
| `coach-settings` | `CoachSettings` | App preferences |

**Backup/Export:**
- Use `backupExport.ts` to dump all data to JSON
- Import functionality for future mobile migration

**Reset Strategy:**
- "Reset Program Data" clears training/diet but keeps profile
- "Reset Everything" clears all including onboarding

---

## Key Architectural Principles

### 1. **Deterministic & Pure**
- All calculations (progression, diet, insights) are pure functions
- Same input always produces same output
- No hidden state mutations

### 2. **Offline-First**
- Zero network dependencies
- All data in localStorage
- Can run completely disconnected

### 3. **Goal-Aware Throughout**
- `BlockGoal` flows from onboarding → program → progression → insights
- Different goals = different sets/reps, RPE thresholds, load jumps
- Diet targets adjust to support training goal

### 4. **Progressive Enhancement**
- Core: Program generation + workout logging
- Enhanced: Pose detection, coach insights, diet tracking
- Optional features degrade gracefully

### 5. **Type Safety**
- TypeScript strict mode everywhere
- Explicit interfaces for all data structures
- No `any` types

### 6. **Feature-Based Organization**
```
src/features/
  ├── onboarding/      # User input collection
  ├── program/         # Week/block generation & management
  ├── workout/         # Live session execution
  ├── history/         # Historical performance
  ├── progression/     # Load suggestion engine
  ├── nutrition/       # Diet calculation & food logging
  ├── today/           # Daily dashboard
  ├── settings/        # Preferences, backup, diagnostics
  └── ...
```

Each feature is self-contained with its own types, storage, and UI.

---

## Future Enhancements (v2+)

**Potential Additions:**
- HRV-based readiness scoring
- Auto-deload triggers based on performance trends
- Simple recipe suggestions aligned with macros
- Exercise video library
- Social features (optional workout sharing)
- Backend sync for multi-device support
- Mobile app (React Native port using this architecture)

**Migration Notes:**
- Current localStorage → backend API
- Add authentication layer
- Sync conflicts resolution
- Offline-first with eventual consistency

---

## Quick Reference: Where Things Live

**"How do I change sets/reps for a goal?"**  
→ `programGenerator.ts` → `generateInitialProgram()` → sets/reps mapping

**"How does progression work?"**  
→ `progressionEngine.ts` → `getLoadSuggestionsForExercises()` → RPE thresholds + increments

**"When do blocks auto-close?"**  
→ `weekRenewal.ts` → `generateNextWeekAndBlock()` → duration + deload check

**"How are diet targets calculated?"**  
→ `dietEngine.ts` → `calculateDietTargets()` → BMR/TDEE/macros

**"Where do coach insights come from?"**  
→ `coachInsights.ts` → `generateCoachInsights()` → adherence/stress/performance rules

**"What's shown on the Today hub?"**  
→ `TodayHub.tsx` → today's session (by weekday) + diet panel

---

**End of Architecture Document**
