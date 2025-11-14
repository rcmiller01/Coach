# AI Workout Coach - Web

A web-based AI-powered workout coaching application that helps users safely build strength, lose fat, and move better through adaptive AI programming and live, camera-based form guidance.

## Project Overview

**Core Goal:** Help users safely build strength, lose fat, and move better by combining adaptive AI programming with live, camera-based form guidance in a web app.

**Target Audience:** Adults (roughly 20–65) who want structured strength/fitness training without hiring a human coach, including beginners with joint issues and time-constrained intermediates.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend (planned):** Python FastAPI (REST API)
- **Database (planned):** PostgreSQL
- **ML/AI:**
  - **Client:** Browser-based pose estimation (MediaPipe / BlazePose / TF.js)
  - **Server:** Cloud LLM (OpenAI, etc.) for program generation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── features/
│   └── onboarding/          # Phase 1 onboarding wizard
│       ├── types.ts         # OnboardingState and enums
│       ├── OnboardingWizard.tsx
│       ├── OnboardingStepWelcome.tsx
│       ├── OnboardingStepBasicProfile.tsx
│       ├── OnboardingStepGoalMotivation.tsx
│       ├── OnboardingStepConstraints.tsx
│       ├── OnboardingStepEnvironment.tsx
│       ├── OnboardingStepSchedule.tsx
│       └── OnboardingStepSummary.tsx
├── lib/
│   └── submitOnboarding.ts  # API integration (placeholder)
└── App.tsx
```

## Current Features

### Phase 1 Onboarding

The onboarding wizard collects:
- **Basic Profile:** Age, height, weight, training experience
- **Goals & Motivation:** Primary fitness goal and personal "why" (140 chars max)
- **Constraints:** Joint issues and severity levels
- **Environment:** Training location and available equipment
- **Schedule:** Sessions per week, preferred days, and time of day

The wizard:
- Validates each step before allowing progression
- Shows live character counter for motivation text (max 140 chars)
- Displays a summary before submission
- Uses a placeholder submit function that logs to console

## Development Notes

- All React components use functional components + hooks
- TypeScript strict mode enabled
- Tailwind CSS for all styling (no CSS-in-JS)
- Mobile-first responsive design
- Form validation at step level

## Roadmap

- [ ] Implement backend API (FastAPI)
- [ ] Integrate LLM for program generation
- [ ] Build workout execution UI
- [ ] Add pose estimation for form checking
- [ ] Implement progress tracking
- [ ] Add admin dashboard

---

## React + TypeScript + Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
