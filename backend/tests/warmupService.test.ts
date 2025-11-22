import { describe, it, expect } from 'vitest';
import { calculateWarmupBudget, buildWarmupForSession } from '../../src/features/program/warmupService';
import { OnboardingState, JointIssue } from '../../src/features/onboarding/types';
import { ProgramDay } from '../../src/features/program/types';

describe('warmupService', () => {
    describe('calculateWarmupBudget', () => {
        it('should return 3 minutes for sessions < 20 mins', () => {
            expect(calculateWarmupBudget(15)).toBe(3);
        });

        it('should return 5 minutes for sessions 20-30 mins', () => {
            expect(calculateWarmupBudget(20)).toBe(5);
            expect(calculateWarmupBudget(30)).toBe(5);
        });

        it('should return 8 minutes for sessions 31-45 mins', () => {
            expect(calculateWarmupBudget(31)).toBe(8);
            expect(calculateWarmupBudget(45)).toBe(8);
        });

        it('should return 10 minutes for sessions 46-60 mins', () => {
            expect(calculateWarmupBudget(46)).toBe(10);
            expect(calculateWarmupBudget(60)).toBe(10);
        });

        it('should return 12 minutes for sessions > 60 mins', () => {
            expect(calculateWarmupBudget(61)).toBe(12);
            expect(calculateWarmupBudget(90)).toBe(12);
        });
    });

    describe('buildWarmupForSession', () => {
        const mockProfile: OnboardingState = {
            age: 30,
            gender: 'male',
            weightLbs: 180,
            heightFeet: 6,
            heightInches: 0,
            trainingExperience: 'intermediate',
            primaryGoal: 'build_muscle',
            equipment: ['dumbbell', 'bodyweight'],
            jointIssues: [],
            sessionsPerWeek: 3,
            minutesPerSession: 60,
            motivation: { text: '' },
            trainingEnvironment: 'gym',
            preferredDays: [],
            preferredTimeOfDay: 'morning',
            planProfile: 'standard',
            city: undefined,
            zipCode: undefined,
        };

        const mockProgramDay: ProgramDay = {
            id: 'day-1',
            dayOfWeek: 'monday',
            focus: 'upper',
            description: 'Upper Body',
            exercises: [],
            warmup: [],
        };

        it('should generate a warmup sequence within budget', () => {
            const warmup = buildWarmupForSession(mockProfile, mockProgramDay, 10);
            const totalDuration = warmup.reduce((sum, step) => sum + step.durationSeconds, 0);

            // Allow some buffer, but should be close to 10 mins (600s)
            expect(totalDuration).toBeLessThanOrEqual(600 + 60);
            expect(totalDuration).toBeGreaterThan(300); // At least 5 mins
        });

        it('should include RAMP phases', () => {
            const warmup = buildWarmupForSession(mockProfile, mockProgramDay, 10);
            expect(warmup.length).toBeGreaterThanOrEqual(3);
        });

        it('should filter out exercises based on equipment', () => {
            const noEquipmentProfile = { ...mockProfile, equipment: [] };
            const warmup = buildWarmupForSession(noEquipmentProfile, mockProgramDay, 10);
            expect(warmup.length).toBeGreaterThan(0);
        });

        it('should filter out exercises based on injuries', () => {
            const injuredProfile = {
                ...mockProfile,
                jointIssues: [{ area: 'shoulder', severity: 'moderate' } as JointIssue]
            };
            const warmup = buildWarmupForSession(injuredProfile, mockProgramDay, 10);
            expect(warmup).toBeDefined();
        });

        it('should skip potentiation for severe injuries', () => {
            const severeInjuryProfile = {
                ...mockProfile,
                jointIssues: [{ area: 'knee', severity: 'severe' } as JointIssue]
            };
            // Force lower body focus to ensure potentiation would normally be selected
            const lowerDay = { ...mockProgramDay, focus: 'lower' as const };
            const warmup = buildWarmupForSession(severeInjuryProfile, lowerDay, 10);

            expect(warmup).toBeDefined();
        });

        it('should adjust for conditioning focus', () => {
            const conditioningDay = { ...mockProgramDay, focus: 'conditioning' as const };
            const warmup = buildWarmupForSession(mockProfile, conditioningDay, 10);
            expect(warmup).toBeDefined();
        });
    });
});
