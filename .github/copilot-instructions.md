# 1. ⚙️ Project Overview & Goal

**Application Name:** (working title) AI Workout Coach – Web

**Core Goal (one sentence):**
Help users safely build strength, lose fat, and move better by combining adaptive AI programming with live, camera-based form guidance in a web app.

**Target Audience:**
Adults (roughly 20–65) who want structured strength/fitness training without hiring a human coach, including beginners with joint issues and time-constrained intermediates.

**Key Technologies (initial stack):**

- **Frontend:** React + TypeScript, Tailwind CSS, PWA-capable
- **Backend (planned):** Node.js/Express or FastAPI (REST API), PostgreSQL (or similar)
- **ML/AI:**
  - **Client:** Browser-based pose estimation (e.g., MediaPipe / BlazePose / TF.js)
  - **Server:** Cloud LLM (OpenAI, etc.) for program generation & summaries

**Architectural Style:**
Client–Server, SPA frontend with a RESTful backend. Future-friendly for microservice split (e.g., separate "Coach Brain" service) but implemented as a simple monolith at first.

---

# 2. 🗺️ Overall Design & Structure

## Frontend Structure

**Goal:**
Single Page Application (SPA) focused on fast onboarding and reliable live workout sessions, mobile-first and PWA-capable.

**Proposed Structure:**

```
/src/
  /components/          – Reusable UI elements
    Buttons, inputs, step indicators, layout wrappers
  /features/
    /onboarding/
      OnboardingWizard.tsx
      OnboardingStepWelcome.tsx
      OnboardingStepBasicProfile.tsx
      OnboardingStepGoalMotivation.tsx
      OnboardingStepConstraints.tsx
      OnboardingStepEnvironment.tsx
      OnboardingStepSchedule.tsx
      OnboardingStepSummary.tsx
      types.ts (OnboardingState, enums)
    /workout/           (future)
      Live Coach Engine UI + hooks
  /lib/
    apiClient.ts        – thin wrapper for backend REST calls
  /styles/
    Tailwind config + global styles
```

**Frontend Design Conventions:**

- All React components in PascalCase.
- Use functional components + React hooks only.
- Use TypeScript types/interfaces for all props and shared data structures.
- Styling via Tailwind CSS; no CSS-in-JS for v1.
- Forms use controlled components; validation at step-level.

## Backend Structure (planned)

**Goal:**
Simple RESTful API for onboarding and workouts, clean resource naming, and a separate "Coach Brain" service later if needed.

**Planned structure (not all implemented yet):**

```
/src/api/
  /onboarding/
    postPhase1.ts       – stores onboarding payload
  /program/
    generateWeek.ts     – generates 1-week training plan from onboarding data
  /workouts/
    CRUD for workout sessions and logs
/src/db/
  Models: User, UserProfile, Equipment, ProgramWeek, WorkoutSession, Exercise, ExerciseRomProfile, etc.
/src/services/
  coachBrainService.ts  – orchestration between DB + LLM for program/debrief
/src/config/            – env, secrets, etc.
```

**Backend Conventions (for later):**

- REST endpoints follow `/api/v1/resource` naming.
- Responses follow a simple `{ data, error }` pattern.
- No business logic in route handlers; use service layer.

---

# 3. 🧩 Component/Module Breakdown

You'll keep expanding this table as new modules appear. For now, focus on onboarding.

| Module / Component | Description (What it Does) | Dependencies / Inputs | Constraints / Conventions |
|--------------------|---------------------------|----------------------|---------------------------|
| **OnboardingState** (type) | Central TypeScript type representing all Phase 1 onboarding data. | None (pure type); used by all onboarding components. | Must include: `age`, `height`, `weight`, `trainingExperience`, `primaryGoal`, `motivation.text` (<= 140 chars), `jointIssues`, `environment`, `equipment`, `sessionsPerWeek`, `preferredDays`, `preferredTimeOfDay`. |
| **OnboardingWizard.tsx** | Top-level multi-step onboarding flow. Manages current step, global OnboardingState, navigation, and final submit. | OnboardingState, all step components, React Router (optional). | Handles step validation; disables "Next" until required fields valid. Final submit calls a placeholder `submitOnboarding(state)` function. |
| **OnboardingStepWelcome.tsx** | Intro screen: explains what the app does and sets expectations (~60 seconds, personalized program). | None beyond basic navigation callbacks. | Must remain minimal and fast – one primary CTA: "Let's start". |
| **OnboardingStepBasicProfile.tsx** | Collects age, height, weight, and training experience. | OnboardingState slice (age, heightCm, weightKg, trainingExperience), onChange callback. | Validate reasonable ranges (e.g., age 13–90, positive height/weight). Do not allow "Next" until all fields pass validation. |
| **OnboardingStepGoalMotivation.tsx** | Collects main training goal and the user's short "why" in <= 140 characters. | primaryGoal, motivation.text slice, onChange callback. | Motivation text box always present. Live character counter (e.g., 72 / 140). Input must be hard-limited to 140 characters in state. |
| **OnboardingStepConstraints.tsx** | Captures joint/injury constraints to protect (knees, hips, lower back, shoulders, elbows/wrists, other). | jointIssues slice, onChange callback. | Represent constraints as array of `{ area, severity, notes? }`. If "None" selected, clear other selections. Severity required when any non-None area is chosen. |
| **OnboardingStepEnvironment.tsx** | Captures training environment (home/gym/outdoors/mix) and available equipment. | trainingEnvironment, equipment, onChange callback. | Equipment stored as string enums for now. Must support multi-select. This step directly affects exercise library filtering and plan templates. |
| **OnboardingStepSchedule.tsx** | Asks how many days per week the user can realistically train, which days, and preferred time of day. | sessionsPerWeek, preferredDays, preferredTimeOfDay, onChange callback. | Days per week value must be 2–6. PreferredDays uses weekday strings ('monday', etc.). Time of day as enum (`'morning'`, `'midday'`, `'evening'`, `'varies'`). |
| **OnboardingStepSummary.tsx** | Displays a human-readable summary of all collected data and offers a "Create my first week" button. | Full OnboardingState, submitOnboarding function. | On submit, call `submitOnboarding(state)` – for now, function logs the payload and simulates success (e.g., timeout + "Plan created" toast). |
| **submitOnboarding(state)** (placeholder fn) | Placeholder for backend integration. Will send Phase 1 onboarding payload to `/api/onboarding/phase1` and then trigger plan generation. | OnboardingState object. | For now: `console.log(state)` and return a resolved Promise. Later: must handle errors and surface them to the wizard (e.g., toast/error banner). |
| **motivation.text** (field) | User's short "why" statement, max 140 chars. Used to personalize coaching tone and suggest real-life actions (play with kids, fit dress, etc.). | User input on Goal/Motivation step. | Must never exceed 140 characters at the state level. UI must show live counter. Backend and Coach Brain treat this as core context for plan interpretation and messaging. |
| **[NEXT ITEM]** | e.g., LiveCoachEngine UI or poseProfile integration. | To be defined. | Add when you begin implementing live workout sessions. |

You'll extend this table as the project grows.

---

# 4. 📝 Current Task Context

**Current Feature/Task:**
Implement Phase 1 Onboarding Wizard UI and state management, including the always-present 140-character motivation field.

**Files Being Created/Modified (frontend):**

- `src/features/onboarding/types.ts`
- `src/features/onboarding/OnboardingWizard.tsx`
- `src/features/onboarding/OnboardingStepWelcome.tsx`
- `src/features/onboarding/OnboardingStepBasicProfile.tsx`
- `src/features/onboarding/OnboardingStepGoalMotivation.tsx`
- `src/features/onboarding/OnboardingStepConstraints.tsx`
- `src/features/onboarding/OnboardingStepEnvironment.tsx`
- `src/features/onboarding/OnboardingStepSchedule.tsx`
- `src/features/onboarding/OnboardingStepSummary.tsx`
- `src/lib/submitOnboarding.ts` (or inline placeholder)

**Specific Implementation Notes:**

1. **Implement a central `OnboardingState` type in `types.ts` roughly as:**

```typescript
type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';

type PrimaryGoal =
  | 'lose_fat'
  | 'build_muscle'
  | 'get_stronger'
  | 'improve_endurance'
  | 'stay_fit';

type JointArea =
  | 'knee'
  | 'hip'
  | 'lower_back'
  | 'shoulder'
  | 'elbow_wrist'
  | 'other';

type JointSeverity = 'mild' | 'moderate' | 'severe';

type JointIssue = {
  area: JointArea;
  severity: JointSeverity;
  notes?: string;
};

type TrainingEnvironment = 'gym' | 'home' | 'outdoors' | 'mix';

type TimeOfDay = 'morning' | 'midday' | 'evening' | 'varies';

interface OnboardingState {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  trainingExperience: TrainingExperience | null;
  primaryGoal: PrimaryGoal | null;
  motivation: {
    text: string; // must be <= 140 chars
  };
  jointIssues: JointIssue[];
  trainingEnvironment: TrainingEnvironment | null;
  equipment: string[];
  sessionsPerWeek: number | null;
  preferredDays: string[]; // ['monday', 'wednesday']
  preferredTimeOfDay: TimeOfDay | null;
}
```

2. **OnboardingWizard must:**
   - Maintain a single `OnboardingState` in `useState`.
   - Provide step components with their slice of state + an `onChange` that updates the main state.
   - Handle `currentStep` and navigation (Next, Back).
   - Validate per-step and disable Next until required fields are valid.

3. **Goal & Motivation step specifics:**
   - Always show the motivation input as a second question:
     - **Q1:** "What's your main goal right now?" (radio group)
     - **Q2:** "Tell me more about your why (describe it in about a tweet – max 140 characters)."
   - Implement a character counter: `currentLength / 140`.
   - Truncate or ignore extra characters so `motivation.text.length <= 140` at all times.

4. **submitOnboarding(state) for now should:**
   - `console.log('Onboarding payload', state);`
   - Simulate an async call (e.g., `setTimeout` or a resolved Promise).
   - On "success", let the wizard move to a "Plan created" state or redirect placeholder.
