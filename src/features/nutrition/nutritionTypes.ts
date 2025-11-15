export interface NutritionTargets {
  caloriesPerDay: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface NutritionProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'male' | 'female' | 'other';
  activityLevel: 'low' | 'moderate' | 'high';
  primaryGoal: 'lose_fat' | 'build_muscle' | 'get_stronger' | 'improve_endurance' | 'stay_fit';
}
