export interface NutritionistProfile {
    userId: string;

    goals: {
        primary: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'performance' | 'general_health';
        pacePreference?: 'slow_and_steady' | 'moderate' | 'aggressive';
    };

    doctorFocusAreas: {
        bloodSugar?: boolean;         // "watch sugar/carbs"
        bloodPressure?: boolean;      // "watch salt/BP"
        cholesterolOrFats?: boolean;  // "watch fried/high-fat foods"
        weight?: boolean;             // "you should lose weight"
        digestion?: boolean;          // "avoid foods that upset your stomach"
    };

    meds: {
        metformin?: boolean;
        glp1OrSimilar?: boolean;
        appetiteSuppressant?: boolean;
        diureticOrBPmeds?: boolean;
        otherGiAffectingMeds?: boolean;
    };

    giAndTolerance: {
        proneToNausea?: boolean;
        highFatMealsBotherMe?: boolean;
        largeMealsBotherMe?: boolean;
        highFiberBothersMe?: boolean;
        dairyIssues?: boolean;
        specificTriggers?: string[]; // free text from user
    };

    eatingPatternPrefs: {
        mealsPerDayPreference?: 2 | 3 | 4 | 5;
        timeRestrictedWindowHours?: number | null;
        breakfastPreference?: 'hungry' | 'neutral' | 'skip_normally';
        lateNightEatingIssue?: boolean;
    };

    activityContext: {
        averageSteps?: number;
        trainingDaysPerWeek?: number;
        trainingType?: 'mostly_lifting' | 'mostly_cardio' | 'mixed';
    };

    updatedAt: string; // ISO date-time for last update

    // Adaptability & Experiments
    currentExperiment?: NutritionExperiment;
    pastExperiments?: NutritionExperiment[];
}

export interface NutritionExperiment {
    id: string;
    startedAt: string;
    focus: 'reduce_evening_overeat' | 'ease_nausea' | 'improve_energy' | 'increase_protein' | 'reduce_hunger' | 'stabilize_blood_sugar';
    changeSummary: string;
    status: 'active' | 'completed' | 'abandoned';
    outcome?: string;
}

export interface NutritionPlanConfig {
    calorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
    mealsPerDay: number;
    perMealConstraints: {
        maxFatPerMeal?: number;
        maxCarbsPerMeal?: number;
        preferEvenCarbDistribution?: boolean;
        avoidDairy?: boolean;
        avoidUserTriggers?: string[];
    };
}

export interface NutritionistResult {
    config: NutritionPlanConfig;
    notes: string[]; // “nutritionist notes” similar to Coach Notes
}

export const initialNutritionistProfile: NutritionistProfile = {
    userId: '',
    goals: { primary: 'general_health' },
    doctorFocusAreas: {},
    meds: {},
    giAndTolerance: {},
    eatingPatternPrefs: {},
    activityContext: {},
    updatedAt: new Date().toISOString(),
    pastExperiments: [],
};
