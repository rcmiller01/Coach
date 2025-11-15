export interface FoodItem {
  id: string;
  name: string;
  protein: number; // grams per serving
  carbs: number;
  fat: number;
  calories: number; // convenience
}

export interface Meal {
  id: string;
  name: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface DailyMealPlan {
  date: string; // YYYY-MM-DD
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
