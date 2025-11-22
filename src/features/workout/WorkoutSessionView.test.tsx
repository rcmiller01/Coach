// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkoutSessionView from './WorkoutSessionView';
import type { ProgramDay } from '../program/types';

// Mocks
vi.mock('@tensorflow-models/pose-detection', () => ({}));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));

vi.mock('../pose/detector/poseDetector', () => ({
    loadPoseModel: vi.fn(),
    estimatePose: vi.fn(),
}));

vi.mock('../pose/detector/angleCalculator', () => ({
    calculateAngles: vi.fn(() => []),
}));

vi.mock('../history/historyStorage', () => ({
    appendHistoryEntry: vi.fn(),
}));

vi.mock('./repCounter', () => ({
    RepCounter: class {
        update() { return false; }
        getCount() { return 0; }
        reset() { }
        getCurrentPhase() { return 'start'; }
    },
    detectExercisePattern: vi.fn(),
}));

// Mock child components to isolate testing
vi.mock('./SessionHud', () => ({
    default: () => <div data-testid="session-hud">Session HUD</div>,
}));
vi.mock('./SessionSummary', () => ({
    default: () => <div data-testid="session-summary">Session Summary</div>,
}));
vi.mock('./mobile/FormCheckSection', () => ({
    default: () => <div data-testid="form-check-section">Form Check Section</div>,
}));
vi.mock('./mobile/ExerciseFocusCard', () => ({
    default: ({ exercise }: any) => <div data-testid="exercise-focus-card">{exercise.name}</div>,
}));
vi.mock('./mobile/BetweenExerciseRest', () => ({
    default: () => <div data-testid="between-exercise-rest">Rest</div>,
}));
vi.mock('./mobile/SessionControlBar', () => ({
    SessionControlBar: () => <div data-testid="session-control-bar">Control Bar</div>,
}));

describe('WorkoutSessionView', () => {
    const mockDay: ProgramDay = {
        id: 'day-1',
        dayOfWeek: 'monday',
        focus: 'full',
        description: 'Test Day',
        warmup: [],
        exercises: [
            {
                id: 'ex-1',
                name: 'Squat',
                sets: 3,
                reps: '5',
                notes: 'Deep',
            },
        ],
    };

    const mockOnExit = () => { };

    it('renders exercise list', () => {
        render(
            <WorkoutSessionView
                programDay={mockDay}
                onExit={mockOnExit}
                onViewExercise={() => { }}
                onSubstituteExercise={() => { }}
                loadSuggestions={[]}
            />
        );

        // Since we mocked ExerciseFocusCard, we check for the mock content
        expect(screen.getByText('Squat')).toBeDefined();
    });

    it('renders session hud', () => {
        render(
            <WorkoutSessionView
                programDay={mockDay}
                onExit={mockOnExit}
                onViewExercise={() => { }}
                onSubstituteExercise={() => { }}
                loadSuggestions={[]}
            />
        );

        expect(screen.getByTestId('session-hud')).toBeDefined();
    });
});
