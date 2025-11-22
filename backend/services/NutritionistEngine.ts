import { NutritionistProfile, NutritionPlanConfig, NutritionistResult, NutritionExperiment } from '../../src/features/nutritionist/types';
import { ProgressSummary } from '../../src/features/progress/types';

export interface NutritionistSessionContext {
    profile: NutritionistProfile;
    progress?: ProgressSummary;
    previousProgress?: ProgressSummary; // For comparing deltas
}

/**
 * Rule-based engine to generate nutrition plan configuration and notes
 */
export function generateNutritionistPlan(context: NutritionistSessionContext): NutritionistResult {
    const { profile, progress, previousProgress } = context;

    // 1. Base Configuration (Defaults)
    const config: NutritionPlanConfig = {
        calorieTarget: 2000,
        proteinTarget: 150,
        carbsTarget: 200,
        fatTarget: 65,
        mealsPerDay: 3,
        perMealConstraints: {},
    };

    const notes: string[] = [];

    // --- EXPERIMENT EVALUATION ---
    if (profile.currentExperiment && progress) {
        const exp = profile.currentExperiment;
        let success = false;

        // Simple evaluation logic based on experiment focus
        if (exp.focus === 'reduce_evening_overeat' || exp.focus === 'reduce_hunger') {
            // Check if calorie adherence improved
            const currentOverage = (progress.nutrition.avgCaloriesDelta || 0);
            const prevOverage = previousProgress ? (previousProgress.nutrition.avgCaloriesDelta || 0) : currentOverage + 200; // Assume improvement if no history

            if (currentOverage < prevOverage) {
                success = true;
                notes.push(`Experiment Update: "${exp.changeSummary}" seems to be working! Your calorie overage dropped from +${prevOverage} to +${currentOverage}.`);
            } else {
                notes.push(`Experiment Update: We tried "${exp.changeSummary}", but adherence hasn't improved yet. We might need a different approach.`);
            }
        } else if (exp.focus === 'ease_nausea') {
            // Qualitative, just ask user or assume success if adherence is okay
            notes.push(`Experiment Update: We've been testing "${exp.changeSummary}" to help with nausea. Let's keep monitoring how you feel.`);
        }

        // Mark experiment as completed in the profile (in a real app, this would happen in the repo/handler)
        // Here we just generate the notes reflecting the outcome.
    }

    // 2. Apply Goal Adjustments
    if (profile.goals.primary === 'fat_loss') {
        config.calorieTarget = 1800;
        if (!profile.currentExperiment) notes.push("We've set a moderate calorie deficit to support fat loss.");
    } else if (profile.goals.primary === 'muscle_gain') {
        config.calorieTarget = 2400;
        if (!profile.currentExperiment) notes.push("We've added a calorie surplus to fuel muscle growth.");
    }

    // 3. Apply Medication & GI Rules
    if (profile.meds.metformin || profile.meds.glp1OrSimilar) {
        if (profile.giAndTolerance.proneToNausea || profile.giAndTolerance.largeMealsBotherMe) {
            config.mealsPerDay = 4;
            config.perMealConstraints.maxFatPerMeal = 20;
            if (!profile.currentExperiment) notes.push("Given your medication and nausea sensitivity, we've split your food into smaller, lighter meals.");
        }
    }

    if (profile.giAndTolerance.highFatMealsBotherMe) {
        config.perMealConstraints.maxFatPerMeal = 15;
        config.fatTarget = Math.max(40, config.fatTarget - 20);
        config.carbsTarget += 45;
        if (!profile.currentExperiment) notes.push("We've limited fat content per meal to help with digestion.");
    }

    if (profile.giAndTolerance.dairyIssues) {
        config.perMealConstraints.avoidDairy = true;
        if (!profile.currentExperiment) notes.push("We've excluded dairy from your meal suggestions.");
    }

    // 4. Apply Doctor Focus Areas
    if (profile.doctorFocusAreas.bloodSugar) {
        config.perMealConstraints.preferEvenCarbDistribution = true;
        config.perMealConstraints.maxCarbsPerMeal = 60;
        if (!profile.currentExperiment) notes.push("To support blood sugar management, we're spreading carbohydrates evenly throughout the day.");
    }

    if (profile.doctorFocusAreas.cholesterolOrFats) {
        config.fatTarget = Math.min(config.fatTarget, 50);
        if (!profile.currentExperiment) notes.push("We've lowered the daily fat target to align with your doctor's advice on cholesterol.");
    }

    // 5. Apply Eating Pattern Preferences
    if (profile.eatingPatternPrefs.mealsPerDayPreference) {
        config.mealsPerDay = profile.eatingPatternPrefs.mealsPerDayPreference;
    }

    // 6. Apply Progress-Based Adjustments & PATTERN RECOGNITION
    if (progress) {
        const avgCals = progress.nutrition.avgCaloriesActual;
        const adherence = Math.abs(progress.nutrition.avgCaloriesDelta || 0);

        // Pattern: High Adherence + Hunger (Hypothetical flag from check-in feedback, or inferred)
        // For now, let's infer "Hunger" if they are consistently slightly over target but workouts are great
        if (progress.workouts.completionRate && progress.workouts.completionRate > 0.8) {
            if ((progress.nutrition.avgCaloriesDelta || 0) > 100 && (progress.nutrition.avgCaloriesDelta || 0) < 400) {
                // "Good workouts, slight overage" -> Suggest volume eating experiment
                if (!profile.currentExperiment) {
                    notes.push("Pattern Spotting: You're crushing workouts but running slightly over on calories. You might be genuinely hungry.");
                    notes.push("Proposed Experiment: Let's try 'Volume Eating' - more fiber and protein to keep you full without extra calories.");

                    // In a real system, we'd return this as a 'proposedExperiment' object
                }
            }
        }

        // Pattern: Stalling on Fat Loss
        if (profile.goals.primary === 'fat_loss' && progress.weight.trend === 'stable') {
            if (avgCals && avgCals <= config.calorieTarget + 100) {
                config.calorieTarget -= 100;
                notes.push("Weight has been stable, so we've slightly reduced calories to restart progress.");
            }
        }
    }

    return { config, notes };
}
