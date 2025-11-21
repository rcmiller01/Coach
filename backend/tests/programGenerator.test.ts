import { describe, it, expect } from 'vitest';
import { generateProgramWeekFromOnboarding } from '../../src/features/program/programGenerator';
import { OnboardingState, initialOnboardingState } from '../../src/features/onboarding/types';

describe('programGenerator', () => {
    const baseOnboarding: OnboardingState = {
        ...initialOnboardingState,
        age: 30,
        weightLbs: 180,
        heightFeet: 5,
        heightInches: 10,
        gender: 'male',
        trainingExperience: 'beginner',
        primaryGoal: 'build_muscle',
        sessionsPerWeek: 3,
        trainingEnvironment: 'gym',
        equipment: ['barbell', 'dumbbell', 'bench'],
        planProfile: 'standard',
    };

    it('generates a valid week structure', () => {
        const week = generateProgramWeekFromOnboarding(baseOnboarding);
        expect(week).toBeDefined();
        expect(week.days).toHaveLength(3);
        expect(week.focus).toBeDefined();
    });

    it('respects sessions per week', () => {
        const fourDay = generateProgramWeekFromOnboarding({ ...baseOnboarding, sessionsPerWeek: 4 });
        expect(fourDay.days).toHaveLength(4);

        const twoDay = generateProgramWeekFromOnboarding({ ...baseOnboarding, sessionsPerWeek: 2 });
        expect(twoDay.days).toHaveLength(2);
    });

    it('respects equipment constraints (Bodyweight only)', () => {
        const bodyweightOnboarding = {
            ...baseOnboarding,
            trainingEnvironment: 'home' as const,
            equipment: ['bodyweight_only'],
        };
        const week = generateProgramWeekFromOnboarding(bodyweightOnboarding);

        week.days.forEach(day => {
            day.exercises.forEach(ex => {
                // Should not have barbell or dumbbell exercises
                expect(ex.name.toLowerCase()).not.toContain('barbell');
                expect(ex.name.toLowerCase()).not.toContain('dumbbell');
                expect(ex.name.toLowerCase()).not.toContain('db');
            });
        });
    });

    it('applies progressive overload logic (implied by structure)', () => {
        // The generator creates the *initial* week. 
        // Overload is usually handled by `generateNextWeek`, but we check initial volumes here.
        const week = generateProgramWeekFromOnboarding(baseOnboarding);
        const squat = week.days[0].exercises.find(e => e.name.includes('Squat'));
        expect(squat).toBeDefined();
        // Hypertrophy goal -> 4 sets
        expect(squat?.sets).toBe(4);
    });

    it('adjusts volume for GLP-1 / reduced recovery profile', () => {
        const glp1Onboarding = {
            ...baseOnboarding,
            planProfile: 'glp1' as const,
        };
        const week = generateProgramWeekFromOnboarding(glp1Onboarding);

        // Check volume of main compound lift
        const squat = week.days[0].exercises.find(e => e.name.includes('Squat'));

        // Standard hypertrophy is 4 sets. GLP-1 should be reduced (e.g., 2 or 3).
        // We expect the generator to handle this.
        expect(squat?.sets).toBeLessThan(4);
    });

    it('handles minimal equipment edge case', () => {
        const minimalOnboarding = {
            ...baseOnboarding,
            equipment: [], // No equipment specified
        };
        const week = generateProgramWeekFromOnboarding(minimalOnboarding);

        // Should default to bodyweight exercises
        const firstDay = week.days[0];
        expect(firstDay.exercises.length).toBeGreaterThan(0);
        expect(firstDay.exercises[0].name).toBeDefined();
    });
});
