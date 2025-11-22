import { describe, it, expect } from 'vitest';
import { generateNutritionistPlan } from '../services/NutritionistEngine';
import { initialNutritionistProfile, NutritionistProfile } from '../../src/features/nutritionist/types';
import { ProgressSummary } from '../../src/features/progress/types';

const initialProfile = initialNutritionistProfile;
const mockProgress: ProgressSummary = {
    userId: 'test-user',
    weekStart: '2023-01-01',
    weekEnd: '2023-01-07',
    workouts: { sessionsCompleted: 3, completionRate: 1, warmupCompletedSessions: 3 },
    nutrition: { daysLogged: 7, avgCaloriesActual: 2200, avgCaloriesDelta: 200, avgProteinActual: 150 },
    weight: { hasEnoughData: true, latest: 180, change: 0, trend: 'stable' },
    insights: []
};

describe('NutritionistEngine', () => {
    it('should generate default plan for healthy user', () => {
        const profile = { ...initialNutritionistProfile };
        const result = generateNutritionistPlan({ profile });

        expect(result.config.mealsPerDay).toBe(3);
        expect(result.notes).toHaveLength(0);
    });

    it('should adjust for fat loss goal', () => {
        const profile: NutritionistProfile = {
            ...initialNutritionistProfile,
            goals: { primary: 'fat_loss' },
        };
        const result = generateNutritionistPlan({ profile });

        expect(result.config.calorieTarget).toBe(1800);
        expect(result.notes[0]).toContain('fat loss');
    });

    it('should handle GLP-1 + Nausea (Smaller meals)', () => {
        const profile: NutritionistProfile = {
            ...initialNutritionistProfile,
            meds: { glp1OrSimilar: true },
            giAndTolerance: { proneToNausea: true },
        };
        const result = generateNutritionistPlan({ profile });

        expect(result.config.mealsPerDay).toBe(4);
        expect(result.config.perMealConstraints.maxFatPerMeal).toBe(20);
        expect(result.notes.some(n => n.includes('nausea'))).toBe(true);
    });

    it('should handle Blood Sugar focus (Even carb spread)', () => {
        const profile: NutritionistProfile = {
            ...initialNutritionistProfile,
            doctorFocusAreas: { bloodSugar: true },
        };
        const result = generateNutritionistPlan({ profile });

        expect(result.config.perMealConstraints.preferEvenCarbDistribution).toBe(true);
        expect(result.config.perMealConstraints.maxCarbsPerMeal).toBe(60);
        expect(result.notes.some(n => n.includes('blood sugar'))).toBe(true);
    });

    it('should handle Dairy Issues', () => {
        const profile: NutritionistProfile = {
            ...initialNutritionistProfile,
            giAndTolerance: { dairyIssues: true },
        };
        const result = generateNutritionistPlan({ profile });

        expect(result.config.perMealConstraints.avoidDairy).toBe(true);
        expect(result.notes.some(n => n.includes('dairy'))).toBe(true);
        it('should suggest volume eating if adherence is poor but workouts are good', () => {
            const result = generateNutritionistPlan({
                profile: { ...initialProfile, goals: { primary: 'fat_loss' } },
                progress: {
                    ...mockProgress,
                    workouts: { ...mockProgress.workouts, completionRate: 0.9 },
                    nutrition: { ...mockProgress.nutrition, avgCaloriesDelta: 250 }
                }
            });

            expect(result.notes).toContainEqual(expect.stringContaining('Pattern Spotting'));
            expect(result.notes).toContainEqual(expect.stringContaining('Volume Eating'));
        });

        it('should evaluate successful experiment', () => {
            const profileWithExp = {
                ...initialProfile,
                currentExperiment: {
                    id: 'exp-1',
                    startedAt: '2023-01-01',
                    focus: 'reduce_evening_overeat' as const,
                    changeSummary: 'No snacks after 8pm',
                    status: 'active' as const
                }
            };

            const result = generateNutritionistPlan({
                profile: profileWithExp,
                progress: { ...mockProgress, nutrition: { ...mockProgress.nutrition, avgCaloriesDelta: 50 } },
                previousProgress: { ...mockProgress, nutrition: { ...mockProgress.nutrition, avgCaloriesDelta: 300 } }
            });

            expect(result.notes).toContainEqual(expect.stringContaining('seems to be working'));
        });
    });

    it('should adjust for progress (Stall in fat loss)', () => {
        const profile: NutritionistProfile = {
            ...initialNutritionistProfile,
            goals: { primary: 'fat_loss' },
        };

        // Mock progress: Adhering to 1800 (target) but weight stable
        const progress: any = {
            weight: { trend: 'stable' },
            nutrition: { avgCaloriesActual: 1800 },
        };

        const result = generateNutritionistPlan({ profile, progress });

        // Should drop from default 1800 to 1700
        expect(result.config.calorieTarget).toBe(1700);
        expect(result.notes.some(n => n.includes('reduced calories'))).toBe(true);
    });
});
