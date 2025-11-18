import type { DailyMealPlan, FoodItem } from './mealTypes';
import { loadMealPlan, saveMealPlan } from './mealPlanStorage';

/**
 * Substitute a food item in a meal plan.
 * Updates the meal plan and recalculates totals.
 */
export function substituteFoodInMealPlan(
  date: string,
  mealId: string,
  foodId: string,
  newFood: FoodItem
): DailyMealPlan | null {
  const plan = loadMealPlan(date);
  if (!plan) return null;

  // Find the meal
  const mealIndex = plan.meals.findIndex((m) => m.id === mealId);
  if (mealIndex === -1) return null;

  const meal = plan.meals[mealIndex];

  // Find the food item
  const foodIndex = meal.foods.findIndex((f) => f.id === foodId);
  if (foodIndex === -1) return null;

  // Preserve the quantity from the old food
  const oldFood = meal.foods[foodIndex];
  const quantity = oldFood.quantity || 1;

  // Create new food with same quantity
  const substitutedFood: FoodItem = {
    ...newFood,
    id: `${newFood.id}-sub-${Date.now()}`,
    quantity,
    calories: newFood.calories * quantity,
    protein: newFood.protein * quantity,
    carbs: newFood.carbs * quantity,
    fat: newFood.fat * quantity,
  };

  // Update the food in the meal
  meal.foods[foodIndex] = substitutedFood;

  // Recalculate meal totals
  meal.totalCalories = meal.foods.reduce((sum, f) => sum + f.calories, 0);
  meal.totalProtein = meal.foods.reduce((sum, f) => sum + f.protein, 0);
  meal.totalCarbs = meal.foods.reduce((sum, f) => sum + f.carbs, 0);
  meal.totalFat = meal.foods.reduce((sum, f) => sum + f.fat, 0);

  // Update the meal in the plan
  plan.meals[mealIndex] = meal;

  // Recalculate plan totals
  plan.totalCalories = plan.meals.reduce((sum, m) => sum + m.totalCalories, 0);
  plan.totalProtein = plan.meals.reduce((sum, m) => sum + m.totalProtein, 0);
  plan.totalCarbs = plan.meals.reduce((sum, m) => sum + m.totalCarbs, 0);
  plan.totalFat = plan.meals.reduce((sum, m) => sum + m.totalFat, 0);

  // Save the updated plan
  saveMealPlan(plan);

  return plan;
}

/**
 * Update the quantity of a food item in a meal plan.
 */
export function updateFoodQuantity(
  date: string,
  mealId: string,
  foodId: string,
  newQuantity: number
): DailyMealPlan | null {
  const plan = loadMealPlan(date);
  if (!plan) return null;

  const mealIndex = plan.meals.findIndex((m) => m.id === mealId);
  if (mealIndex === -1) return null;

  const meal = plan.meals[mealIndex];
  const foodIndex = meal.foods.findIndex((f) => f.id === foodId);
  if (foodIndex === -1) return null;

  const food = meal.foods[foodIndex];

  // Calculate base values (per serving)
  const baseCalories = food.calories / (food.quantity || 1);
  const baseProtein = food.protein / (food.quantity || 1);
  const baseCarbs = food.carbs / (food.quantity || 1);
  const baseFat = food.fat / (food.quantity || 1);

  // Update with new quantity
  food.quantity = newQuantity;
  food.calories = baseCalories * newQuantity;
  food.protein = baseProtein * newQuantity;
  food.carbs = baseCarbs * newQuantity;
  food.fat = baseFat * newQuantity;

  meal.foods[foodIndex] = food;

  // Recalculate meal totals
  meal.totalCalories = meal.foods.reduce((sum, f) => sum + f.calories, 0);
  meal.totalProtein = meal.foods.reduce((sum, f) => sum + f.protein, 0);
  meal.totalCarbs = meal.foods.reduce((sum, f) => sum + f.carbs, 0);
  meal.totalFat = meal.foods.reduce((sum, f) => sum + f.fat, 0);

  plan.meals[mealIndex] = meal;

  // Recalculate plan totals
  plan.totalCalories = plan.meals.reduce((sum, m) => sum + m.totalCalories, 0);
  plan.totalProtein = plan.meals.reduce((sum, m) => sum + m.totalProtein, 0);
  plan.totalCarbs = plan.meals.reduce((sum, m) => sum + m.totalCarbs, 0);
  plan.totalFat = plan.meals.reduce((sum, m) => sum + m.totalFat, 0);

  saveMealPlan(plan);

  return plan;
}
