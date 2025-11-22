
export type WarmupType = 'cardio' | 'mobility' | 'activation' | 'potentiation';
export type BodyRegion = 'upper' | 'lower' | 'full' | 'core';
export type WarmupIntensity = 'low' | 'moderate';

export interface WarmupExercise {
    id: string;
    name: string;
    type: WarmupType;
    bodyRegions: BodyRegion[];
    intensity: WarmupIntensity;
    equipment: string[];
    durationSeconds: number;
    contraindications?: {
        kneeOsteoarthritis?: boolean;
        lowBackPain?: boolean;
        shoulderImpingement?: boolean;
        uncontrolledHypertension?: boolean;
        balanceIssues?: boolean;
    };
    minAge?: number;
    maxAge?: number;
}

export const WARMUP_CATALOG: WarmupExercise[] = [
    // --- Cardio (Raise) ---
    {
        id: 'jumping-jacks',
        name: 'Jumping Jacks',
        type: 'cardio',
        bodyRegions: ['full'],
        intensity: 'moderate',
        equipment: ['bodyweight'],
        durationSeconds: 60,
        contraindications: {
            kneeOsteoarthritis: true,
            balanceIssues: true,
            uncontrolledHypertension: true, // High impact
        },
    },
    {
        id: 'march-in-place',
        name: 'March in Place',
        type: 'cardio',
        bodyRegions: ['lower', 'core'],
        intensity: 'low',
        equipment: ['bodyweight'],
        durationSeconds: 60,
    },
    {
        id: 'arm-circles',
        name: 'Arm Circles',
        type: 'cardio',
        bodyRegions: ['upper'],
        intensity: 'low',
        equipment: ['bodyweight'],
        durationSeconds: 30,
    },
    {
        id: 'high-knees',
        name: 'High Knees',
        type: 'cardio',
        bodyRegions: ['lower', 'core'],
        intensity: 'moderate',
        equipment: ['bodyweight'],
        durationSeconds: 45,
        contraindications: {
            kneeOsteoarthritis: true,
            balanceIssues: true,
        },
    },

    // --- Mobility ---
    {
        id: 'cat-cow',
        name: 'Cat-Cow Stretch',
        type: 'mobility',
        bodyRegions: ['core', 'upper'],
        intensity: 'low',
        equipment: ['bodyweight'],
        durationSeconds: 45,
    },
    {
        id: 'thoracic-rotation',
        name: 'Thoracic Rotation',
        type: 'mobility',
        bodyRegions: ['upper', 'core'],
        intensity: 'low',
        equipment: ['bodyweight'],
        durationSeconds: 45, // usually per side, but total here for simplicity or split in UI
    },
    {
        id: 'leg-swings',
        name: 'Leg Swings',
        type: 'mobility',
        bodyRegions: ['lower'],
        intensity: 'low',
        equipment: ['bodyweight'],
        durationSeconds: 45,
        contraindications: {
            balanceIssues: true,
        },
    },
    {
        id: 'hip-circles',
        name: 'Hip Circles',
        type: 'mobility',
        bodyRegions: ['lower', 'core'],
        intensity: 'low',
        equipment: ['bodyweight'],
        durationSeconds: 30,
    },
    {
        id: 'shoulder-dislocates',
        name: 'Band Shoulder Dislocates',
        type: 'mobility',
        bodyRegions: ['upper'],
        intensity: 'low',
        equipment: ['band'],
        durationSeconds: 45,
        contraindications: {
            shoulderImpingement: true,
        },
    },

    // --- Activation ---
    {
        id: 'glute-bridge',
        name: 'Glute Bridge',
        type: 'activation',
        bodyRegions: ['lower', 'core'],
        intensity: 'low',
        equipment: ['bodyweight'],
        durationSeconds: 45,
    },
    {
        id: 'band-pull-aparts',
        name: 'Band Pull-Aparts',
        type: 'activation',
        bodyRegions: ['upper'],
        intensity: 'low',
        equipment: ['band'],
        durationSeconds: 45,
    },
    {
        id: 'plank',
        name: 'Plank Hold',
        type: 'activation',
        bodyRegions: ['core'],
        intensity: 'moderate',
        equipment: ['bodyweight'],
        durationSeconds: 45,
        contraindications: {
            uncontrolledHypertension: true, // Isometric
        },
    },
    {
        id: 'clam-shells',
        name: 'Clam Shells',
        type: 'activation',
        bodyRegions: ['lower'],
        intensity: 'low',
        equipment: ['bodyweight', 'band'],
        durationSeconds: 45,
    },
    {
        id: 'dead-bug',
        name: 'Dead Bug',
        type: 'activation',
        bodyRegions: ['core'],
        intensity: 'low',
        equipment: ['bodyweight'],
        durationSeconds: 45,
    },

    // --- Potentiation (RAMP - Potentiate) ---
    {
        id: 'bodyweight-squat',
        name: 'Bodyweight Squat',
        type: 'potentiation',
        bodyRegions: ['lower', 'full'],
        intensity: 'moderate',
        equipment: ['bodyweight'],
        durationSeconds: 45,
        contraindications: {
            kneeOsteoarthritis: true, // Deep squats might be painful
        },
    },
    {
        id: 'push-up-incline',
        name: 'Incline Push-Up',
        type: 'potentiation',
        bodyRegions: ['upper'],
        intensity: 'moderate',
        equipment: ['bodyweight'], // technically needs a surface
        durationSeconds: 45,
    },
    {
        id: 'lunge-reverse',
        name: 'Reverse Lunge',
        type: 'potentiation',
        bodyRegions: ['lower'],
        intensity: 'moderate',
        equipment: ['bodyweight'],
        durationSeconds: 45,
        contraindications: {
            kneeOsteoarthritis: true,
            balanceIssues: true,
        },
    },
];
