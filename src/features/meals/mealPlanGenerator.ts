import type { NutritionTargets } from '../nutrition/nutritionTypes';
import type { DailyMealPlan, Meal, FoodItem } from './mealTypes';
import { PROTEINS, CARBS, FATS, VEGETABLES } from './foodDatabase';

/**
 * Generate a simple daily meal plan from nutrition targets.
 * Uses deterministic rule-based logic to create 3 meals.
 */
export function generateDailyMealPlan(
  targets: NutritionTargets,
  date: string = new Date().toISOString().slice(0, 10)
): DailyMealPlan {
  // Allocate calories across 3 meals
  const breakfastCals = Math.round(targets.caloriesPerDay * 0.25);
  const lunchCals = Math.round(targets.caloriesPerDay * 0.35);
  const dinnerCals = Math.round(targets.caloriesPerDay * 0.40);

  // Generate each meal
  const breakfast = generateMeal('breakfast', 'Breakfast', breakfastCals);
  const lunch = generateMeal('lunch', 'Lunch', lunchCals);
  const dinner = generateMeal('dinner', 'Dinner', dinnerCals);

  const meals = [breakfast, lunch, dinner];

  // Calculate totals
  const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.totalProtein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.totalCarbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.totalFat, 0);

  return {
    date,
    meals,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  };
}

/**
 * Generate a single meal based on calorie target.
 * Simple greedy approach: pick protein + carb + optional fat.
 */
function generateMeal(
  id: string,
  name: string,
  targetCalories: number
): Meal {
  const foods: FoodItem[] = [];

  // Pick protein source based on meal
  let proteinSource: FoodItem;
  if (id === 'breakfast') {
    proteinSource = PROTEINS.find(f => f.id === 'eggs') || PROTEINS[0];
  } else if (id === 'lunch') {
    proteinSource = PROTEINS.find(f => f.id === 'chicken-breast') || PROTEINS[0];
  } else {
    proteinSource = PROTEINS.find(f => f.id === 'salmon') || PROTEINS[0];
  }

  // Pick carb source based on meal
  let carbSource: FoodItem;
  if (id === 'breakfast') {
    carbSource = CARBS.find(f => f.id === 'oatmeal') || CARBS[0];
  } else if (id === 'lunch') {
    carbSource = CARBS.find(f => f.id === 'rice') || CARBS[0];
  } else {
    carbSource = CARBS.find(f => f.id === 'sweet-potato') || CARBS[0];
  }

  // Calculate servings needed (simplified)
  // Allocate roughly: 40% protein, 40% carbs, 20% fat
  const proteinCals = targetCalories * 0.4;
  const carbCals = targetCalories * 0.4;
  const fatCals = targetCalories * 0.2;

  const proteinServings = Math.max(0.5, Math.min(3, Math.round((proteinCals / proteinSource.calories) * 2) / 2));
  const carbServings = Math.max(0.5, Math.min(3, Math.round((carbCals / carbSource.calories) * 2) / 2));

  // Add protein with quantity
  foods.push({
    ...proteinSource,
    quantity: proteinServings,
    calories: proteinSource.calories * proteinServings,
    protein: proteinSource.protein * proteinServings,
    carbs: proteinSource.carbs * proteinServings,
    fat: proteinSource.fat * proteinServings,
  });

  // Add carb with quantity
  foods.push({
    ...carbSource,
    quantity: carbServings,
    calories: carbSource.calories * carbServings,
    protein: carbSource.protein * carbServings,
    carbs: carbSource.carbs * carbServings,
    fat: carbSource.fat * carbServings,
  });

  // Add vegetables (always 1 serving for lunch/dinner)
  if (id !== 'breakfast' && VEGETABLES.length > 0) {
    foods.push({ ...VEGETABLES[0], quantity: 1 });
  }

  // Add fat source if needed (avocado for breakfast, olive oil for dinner)
  const currentFat = foods.reduce((sum, f) => sum + f.fat, 0);
  const targetFat = fatCals / 9;
  if (currentFat < targetFat - 5) {
    if (id === 'breakfast') {
      const avocado = FATS.find(f => f.id === 'avocado');
      if (avocado) foods.push({ ...avocado, quantity: 1 });
    } else {
      const oil = FATS.find(f => f.id === 'olive-oil');
      if (oil) foods.push({ ...oil, quantity: 1 });
    }
  }

  // Calculate meal totals
  const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
  const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
  const totalFat = foods.reduce((sum, f) => sum + f.fat, 0);

  return {
    id,
    name,
    foods,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  };
}
