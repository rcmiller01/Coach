/**
 * Test Suite: Meal Planning AI
 * 
 * Tests for generateMealPlanForDay and generateMealPlanForWeek
 * 
 * Run with: npx tsx backend/test-meal-planning.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { RealNutritionAiService } from './RealNutritionAiService';
import type { NutritionTargets, DayPlan, WeeklyPlan, DietaryPreferences } from '../src/features/nutrition/nutritionTypes';
import { NutritionApiError } from '../src/features/nutrition/nutritionTypes';
import { Pool } from 'pg';
import { initializeDb } from './nutritionTools';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_USER_ID = 'test-meal-planning-user';

const SAMPLE_TARGETS: NutritionTargets = {
  caloriesPerDay: 2300,
  proteinGrams: 160,
  carbsGrams: 250,
  fatGrams: 70,
};

// ============================================================================
// TEST HELPERS
// ============================================================================

function validateCalories(actual: number, target: number): { pass: boolean; message: string } {
  const diff = Math.abs(actual - target);
  const percentDiff = diff / target;
  const pass = percentDiff <= 0.10; // Within ±10%

  return {
    pass,
    message: pass
      ? `✅ Calories within range: ${actual} (target ${target})`
      : `❌ Calories out of range: ${actual} vs ${target} (${Math.round(percentDiff * 100)}% diff)`,
  };
}

function validateProtein(actual: number, target: number): { pass: boolean; message: string } {
  const diff = actual - target;
  const percentDiff = diff / target;
  const pass = diff >= 0 || percentDiff >= -0.05; // Meet or within -5%

  return {
    pass,
    message: pass
      ? `✅ Protein target met: ${Math.round(actual)}g (target ${target}g)`
      : `❌ Protein below target: ${Math.round(actual)}g vs ${target}g`,
  };
}

function calculateDayTotals(dayPlan: DayPlan): {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
} {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fats = 0;

  dayPlan.meals.forEach(meal => {
    meal.items.forEach(item => {
      calories += item.calories;
      protein += item.proteinGrams;
      carbs += item.carbsGrams;
      fats += item.fatsGrams;
    });
  });

  return { calories, protein, carbs, fats };
}

// ============================================================================
// TESTS
// ============================================================================

async function testGenerateMealPlanForDay() {
  console.log('\n📋 TEST: generateMealPlanForDay');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log(`Generating meal plan for ${today}...`);
    console.log(`Targets: ${SAMPLE_TARGETS.caloriesPerDay} kcal, ${SAMPLE_TARGETS.proteinGrams}g protein`);

    const startTime = Date.now();
    const dayPlan = await service.generateMealPlanForDay({
      date: today,
      targets: SAMPLE_TARGETS,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
    });
    const duration = Date.now() - startTime;

    console.log(`✅ Plan generated in ${duration}ms`);
    console.log(`\nMeals: ${dayPlan.meals.length}`);

    // Validate structure
    const hasBrekfast = dayPlan.meals.some(m => m.type === 'breakfast');
    const hasLunch = dayPlan.meals.some(m => m.type === 'lunch');
    const hasDinner = dayPlan.meals.some(m => m.type === 'dinner');
    const hasSnack = dayPlan.meals.some(m => m.type === 'snack');

    console.log(`  - Breakfast: ${hasBrekfast ? '✅' : '❌'}`);
    console.log(`  - Lunch: ${hasLunch ? '✅' : '❌'}`);
    console.log(`  - Dinner: ${hasDinner ? '✅' : '❌'}`);
    console.log(`  - Snack: ${hasSnack ? '✅' : '❌'}`);

    // Calculate totals
    const totals = calculateDayTotals(dayPlan);
    console.log(`\nNutrition Totals:`);
    console.log(`  Calories: ${totals.calories}`);
    console.log(`  Protein: ${Math.round(totals.protein)}g`);
    console.log(`  Carbs: ${Math.round(totals.carbs)}g`);
    console.log(`  Fats: ${Math.round(totals.fats)}g`);

    // Validate accuracy
    const calorieCheck = validateCalories(totals.calories, SAMPLE_TARGETS.caloriesPerDay);
    const proteinCheck = validateProtein(totals.protein, SAMPLE_TARGETS.proteinGrams);

    console.log(`\nAccuracy:`);
    console.log(`  ${calorieCheck.message}`);
    console.log(`  ${proteinCheck.message}`);

    // Check AI explanation
    if (dayPlan.aiExplanation) {
      console.log(`\nAI Explanation:`);
      console.log(`  Summary: ${dayPlan.aiExplanation.summary}`);
      if (dayPlan.aiExplanation.details) {
        console.log(`  Details: ${dayPlan.aiExplanation.details}`);
      }
    }

    // Print meal details
    console.log(`\nMeal Breakdown:`);
    dayPlan.meals.forEach(meal => {
      const mealTotal = meal.items.reduce((sum, item) => sum + item.calories, 0);
      console.log(`\n  ${meal.type.toUpperCase()} (${mealTotal} kcal):`);
      meal.items.forEach(item => {
        console.log(`    - ${item.name}: ${item.quantity} ${item.unit} (${item.calories} kcal, ${Math.round(item.proteinGrams)}g P)`);
      });
    });

    const allTestsPass = calorieCheck.pass && proteinCheck.pass && hasBrekfast && hasLunch && hasDinner;

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testGenerateMealPlanForWeek() {
  console.log('\n📅 TEST: generateMealPlanForWeek');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();

  // Get Monday of current week
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  today.setDate(diff);
  const weekStart = today.toISOString().split('T')[0];

  try {
    console.log(`Generating weekly meal plan starting ${weekStart}...`);
    console.log(`Targets: ${SAMPLE_TARGETS.caloriesPerDay} kcal/day, ${SAMPLE_TARGETS.proteinGrams}g protein/day`);

    const startTime = Date.now();
    const weeklyPlan = await service.generateMealPlanForWeek({
      weekStartDate: weekStart,
      targets: SAMPLE_TARGETS,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
    });
    const duration = Date.now() - startTime;

    console.log(`✅ Weekly plan generated in ${duration}ms`);
    console.log(`\nDays: ${weeklyPlan.days.length}`);

    // Validate 7 days
    const has7Days = weeklyPlan.days.length === 7;
    console.log(`  - 7 days generated: ${has7Days ? '✅' : '❌'}`);

    // Check breakfast repetition
    const breakfasts = weeklyPlan.days.map(d => {
      const breakfast = d.meals.find(m => m.type === 'breakfast');
      if (!breakfast) return null;
      return breakfast.items.map(i => i.name).join(', ');
    });

    const uniqueBreakfasts = new Set(breakfasts.filter(b => b !== null));
    const hasRepetition = uniqueBreakfasts.size < 7;

    console.log(`  - Breakfast repetition: ${hasRepetition ? '✅' : '❌'} (${uniqueBreakfasts.size} unique breakfasts)`);

    // Validate each day
    console.log(`\nDaily Breakdown:`);
    let allDaysPass = true;

    weeklyPlan.days.forEach((dayPlan) => {
      const totals = calculateDayTotals(dayPlan);
      const calorieCheck = validateCalories(totals.calories, SAMPLE_TARGETS.caloriesPerDay);
      const proteinCheck = validateProtein(totals.protein, SAMPLE_TARGETS.proteinGrams);

      const dayPass = calorieCheck.pass && proteinCheck.pass;
      if (!dayPass) allDaysPass = false;

      const dayName = new Date(dayPlan.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
      console.log(`\n  ${dayName} (${dayPlan.date}):`);
      console.log(`    ${calorieCheck.pass ? '✅' : '❌'} ${totals.calories} kcal`);
      console.log(`    ${proteinCheck.pass ? '✅' : '❌'} ${Math.round(totals.protein)}g protein`);
      console.log(`    Meals: ${dayPlan.meals.map(m => m.type).join(', ')}`);
    });

    const allTestsPass = has7Days && hasRepetition && allDaysPass;

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testGLP1FeasiblePlan(): Promise<boolean> {
  console.log('\n💊 TEST: GLP-1 Feasible Plan (1500 kcal, 110g protein)');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();
  const today = new Date().toISOString().split('T')[0];

  const glp1Targets: NutritionTargets = {
    caloriesPerDay: 1500,
    proteinGrams: 110,
    carbsGrams: 130,
    fatGrams: 55,
  };

  try {
    console.log(`Generating GLP-1 meal plan for ${today}...`);
    console.log(`Targets: ${glp1Targets.caloriesPerDay} kcal, ${glp1Targets.proteinGrams}g protein`);

    const startTime = Date.now();
    const dayPlan = await service.generateMealPlanForDay({
      date: today,
      targets: glp1Targets,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
      planProfile: 'glp1',
    });
    const duration = Date.now() - startTime;

    console.log(`✅ GLP-1 plan generated in ${duration}ms`);

    // Validate GLP-1 label
    const hasGLP1Label = dayPlan.aiExplanation?.summary.includes('GLP-1') ?? false;
    console.log(`  - GLP-1 label in summary: ${hasGLP1Label ? '✅' : '❌'}`);

    // Calculate totals
    const totals = calculateDayTotals(dayPlan);
    console.log(`\nNutrition Totals:`);
    console.log(`  Calories: ${totals.calories}`);
    console.log(`  Protein: ${Math.round(totals.protein)}g`);

    // Validate accuracy
    const calorieCheck = validateCalories(totals.calories, glp1Targets.caloriesPerDay);
    const proteinCheck = validateProtein(totals.protein, glp1Targets.proteinGrams);

    console.log(`\nAccuracy:`);
    console.log(`  ${calorieCheck.message}`);
    console.log(`  ${proteinCheck.message}`);

    // Check meal distribution (should be 20/25/25/30 for GLP-1)
    console.log(`\nMeal Distribution:`);
    dayPlan.meals.forEach(meal => {
      const mealTotal = meal.items.reduce((sum, item) => sum + item.calories, 0);
      const percentOfDay = ((mealTotal / totals.calories) * 100).toFixed(0);
      console.log(`  ${meal.type}: ${mealTotal} kcal (${percentOfDay}%)`);
    });

    const allTestsPass = calorieCheck.pass && proteinCheck.pass && hasGLP1Label;

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testGLP1InfeasiblePlan(): Promise<boolean> {
  console.log('\n🚫 TEST: GLP-1 Infeasible Plan (1200 kcal, 200g protein)');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();
  const today = new Date().toISOString().split('T')[0];

  const impossibleTargets: NutritionTargets = {
    caloriesPerDay: 1200,
    proteinGrams: 200, // 200g * 4 kcal/g = 800 kcal protein alone (67% of total)
    carbsGrams: 50,
    fatGrams: 20,
  };

  try {
    console.log(`Attempting to generate impossible GLP-1 meal plan...`);
    console.log(`Targets: ${impossibleTargets.caloriesPerDay} kcal, ${impossibleTargets.proteinGrams}g protein`);
    console.log(`Note: Protein alone requires ${impossibleTargets.proteinGrams * 4} kcal (${Math.round((impossibleTargets.proteinGrams * 4 / impossibleTargets.caloriesPerDay) * 100)}% of total)`);

    const dayPlan = await service.generateMealPlanForDay({
      date: today,
      targets: impossibleTargets,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
      planProfile: 'glp1',
    });

    // If we get here, validation didn't work
    console.log('❌ TEST FAILED: Should have thrown AI_PLAN_INFEASIBLE error');
    console.log(`Got plan: ${JSON.stringify(dayPlan, null, 2)}`);
    return false;

  } catch (error) {
    // We EXPECT this to fail with AI_PLAN_INFEASIBLE
    if (error instanceof Error && 'code' in error) {
      const err = error as Error & { code?: string; message: string };
      if (err.code === 'AI_PLAN_INFEASIBLE') {
        console.log('✅ Correctly rejected infeasible plan');
        console.log(`Error message: ${err.message}`);

        // Check that error message is helpful
        const hasHelpfulMessage = err.message.includes('protein') || err.message.includes('calories');
        console.log(`  - Helpful error message: ${hasHelpfulMessage ? '✅' : '❌'}`);

        return hasHelpfulMessage;
      } else {
        console.log(`❌ Wrong error type: ${err.code}`);
        console.error(error);
        return false;
      }
    } else {
      console.log('❌ Unknown error type');
      console.error(error);
      return false;
    }
  }
}

// ============================================================================
// PHASE 7 TESTS: Regeneration, Locking, and Preferences
// ============================================================================

async function testRegenerateMealKeepsDayConstraints(): Promise<boolean> {
  console.log('\n🔄 TEST: Regenerate Meal Keeps Day Constraints');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('Step 1: Generate initial day plan...');
    const originalPlan = await service.generateMealPlanForDay({
      date: today,
      targets: SAMPLE_TARGETS,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
    });

    const originalTotals = calculateDayTotals(originalPlan);
    const originalLunch = originalPlan.meals.find(m => m.type === 'lunch');

    console.log(`Original totals: ${originalTotals.calories} kcal, ${Math.round(originalTotals.protein)}g protein`);
    console.log(`Original lunch: ${originalLunch?.items.map(i => i.name).join(', ')}`);

    // Find lunch index
    const lunchIndex = originalPlan.meals.findIndex(m => m.type === 'lunch');
    if (lunchIndex === -1) {
      console.log('❌ No lunch meal found');
      return false;
    }

    console.log('\nStep 2: Regenerate lunch...');
    const updatedPlan = await service.regenerateMeal({
      date: today,
      dayPlan: originalPlan,
      mealIndex: lunchIndex,
      targets: SAMPLE_TARGETS,
      userId: TEST_USER_ID,
      planProfile: 'standard',
    });

    const updatedTotals = calculateDayTotals(updatedPlan);
    const updatedLunch = updatedPlan.meals[lunchIndex];

    console.log(`Updated totals: ${updatedTotals.calories} kcal, ${Math.round(updatedTotals.protein)}g protein`);
    console.log(`Updated lunch: ${updatedLunch.items.map(i => i.name).join(', ')}`);

    // Validation
    const has4Meals = updatedPlan.meals.length === 4;
    const caloriesValid = validateCalories(updatedTotals.calories, SAMPLE_TARGETS.caloriesPerDay);
    const proteinValid = validateProtein(updatedTotals.protein, SAMPLE_TARGETS.proteinGrams);

    // Check that lunch changed
    const lunchChanged = originalLunch?.items[0]?.name !== updatedLunch.items[0]?.name;

    // Check that other meals unchanged
    const breakfastSame = originalPlan.meals[0].items[0].name === updatedPlan.meals[0].items[0].name;
    const dinnerIndex = originalPlan.meals.findIndex(m => m.type === 'dinner');
    const dinnerSame = dinnerIndex !== -1 &&
      originalPlan.meals[dinnerIndex].items[0].name === updatedPlan.meals[dinnerIndex].items[0].name;

    console.log('\nValidation:');
    console.log(`  - 4 meals: ${has4Meals ? '✅' : '❌'}`);
    console.log(`  ${caloriesValid.message}`);
    console.log(`  ${proteinValid.message}`);
    console.log(`  - Lunch changed: ${lunchChanged ? '✅' : '❌'}`);
    console.log(`  - Breakfast unchanged: ${breakfastSame ? '✅' : '❌'}`);
    console.log(`  - Dinner unchanged: ${dinnerSame ? '✅' : '❌'}`);

    const allTestsPass = has4Meals && caloriesValid.pass && proteinValid.pass && lunchChanged && breakfastSame;

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testRegenerateMealRespectsGLP1Profile(): Promise<boolean> {
  console.log('\n💊 TEST: Regenerate Meal Respects GLP-1 Profile');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();
  const today = new Date().toISOString().split('T')[0];

  const glp1Targets: NutritionTargets = {
    caloriesPerDay: 1500,
    proteinGrams: 110,
    carbsGrams: 130,
    fatGrams: 55,
  };

  try {
    console.log('Step 1: Generate GLP-1 day plan...');
    const originalPlan = await service.generateMealPlanForDay({
      date: today,
      targets: glp1Targets,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
      planProfile: 'glp1',
    });

    const dinnerIndex = originalPlan.meals.findIndex(m => m.type === 'dinner');
    if (dinnerIndex === -1) {
      console.log('❌ No dinner meal found');
      return false;
    }

    console.log('\nStep 2: Regenerate dinner...');
    const updatedPlan = await service.regenerateMeal({
      date: today,
      dayPlan: originalPlan,
      mealIndex: dinnerIndex,
      targets: glp1Targets,
      userId: TEST_USER_ID,
      planProfile: 'glp1',
    });

    const updatedDinner = updatedPlan.meals[dinnerIndex];
    const dinnerCalories = updatedDinner.items.reduce((sum, item) => sum + item.calories, 0);

    console.log(`Updated dinner: ${updatedDinner.items.map(i => i.name).join(', ')}`);
    console.log(`Dinner calories: ${dinnerCalories} (${Math.round((dinnerCalories / glp1Targets.caloriesPerDay) * 100)}% of daily)`);

    // Validation
    const hasGLP1Label = updatedPlan.aiExplanation?.summary.includes('GLP-1') ?? false;
    const dinnerAppropriateCals = dinnerCalories >= 300 && dinnerCalories <= 450; // 25% of 1500 = 375, allow ±20%

    // Check portion sizes (should be reasonable for GLP-1)
    const hasLargePortions = updatedDinner.items.some(item => {
      const qty = parseFloat(item.quantity);
      return (item.unit === 'oz' && qty > 8) || (item.unit === 'cup' && qty > 2);
    });

    console.log('\nValidation:');
    console.log(`  - GLP-1 in summary: ${hasGLP1Label ? '✅' : '❌'}`);
    console.log(`  - Dinner calories appropriate (300-450): ${dinnerAppropriateCals ? '✅' : '❌'}`);
    console.log(`  - No large portions: ${!hasLargePortions ? '✅' : '❌'}`);

    const allTestsPass = hasGLP1Label && dinnerAppropriateCals && !hasLargePortions;

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testLockedMealsAreReusedAcrossWeeks(): Promise<boolean> {
  console.log('\n🔒 TEST: Locked Meals Are Reused Across Weeks');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();

  // Get Monday of current week
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  today.setDate(diff);
  const weekStart = today.toISOString().split('T')[0];

  try {
    console.log('Step 1: Generate week 1...');
    const week1 = await service.generateMealPlanForWeek({
      weekStartDate: weekStart,
      targets: SAMPLE_TARGETS,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
    });

    // Lock Monday breakfast
    const mondayPlan = week1.days[0];
    const breakfastIndex = mondayPlan.meals.findIndex(m => m.type === 'breakfast');
    if (breakfastIndex === -1) {
      console.log('❌ No breakfast found on Monday');
      return false;
    }

    mondayPlan.meals[breakfastIndex].locked = true;
    const lockedBreakfast = mondayPlan.meals[breakfastIndex];
    const lockedCalories = lockedBreakfast.items.reduce((sum, item) => sum + item.calories, 0);

    console.log(`Locked Monday breakfast: ${lockedBreakfast.items.map(i => `${i.name} (${i.calories} kcal)`).join(', ')}`);
    console.log(`Total locked calories: ${lockedCalories}`);

    console.log('\nStep 2: Generate week 2 with previousWeek...');

    // Advance to next week
    const nextWeekDate = new Date(weekStart);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekStart = nextWeekDate.toISOString().split('T')[0];

    const week2 = await service.generateMealPlanForWeek({
      weekStartDate: nextWeekStart,
      targets: SAMPLE_TARGETS,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
      previousWeek: week1,
    });

    const newMondayBreakfast = week2.days[0].meals.find(m => m.type === 'breakfast');
    if (!newMondayBreakfast) {
      console.log('❌ No breakfast found on new Monday');
      return false;
    }

    console.log(`Week 2 Monday breakfast: ${newMondayBreakfast.items.map(i => `${i.name} (${i.calories} kcal)`).join(', ')}`);

    // Validation: Check if meals are identical
    const itemsMatch = lockedBreakfast.items.length === newMondayBreakfast.items.length &&
      lockedBreakfast.items.every((item, idx) => {
        const newItem = newMondayBreakfast.items[idx];
        return item.name === newItem.name &&
          item.quantity === newItem.quantity &&
          Math.abs(item.calories - newItem.calories) < 5;
      });

    const caloriesMatch = Math.abs(
      lockedBreakfast.items.reduce((sum, i) => sum + i.calories, 0) -
      newMondayBreakfast.items.reduce((sum, i) => sum + i.calories, 0)
    ) < 10;

    // Check that other meals are different (Tuesday breakfast should be new)
    const tuesdayBreakfast = week2.days[1].meals.find(m => m.type === 'breakfast');
    const tuesdayDifferent = tuesdayBreakfast &&
      tuesdayBreakfast.items[0].name !== lockedBreakfast.items[0].name;

    console.log('\nValidation:');
    console.log(`  - Items match: ${itemsMatch ? '✅' : '❌'}`);
    console.log(`  - Calories match: ${caloriesMatch ? '✅' : '❌'}`);
    console.log(`  - Other meals regenerated: ${tuesdayDifferent ? '✅' : '❌'}`);
    console.log(`  - Locked badge present: ${newMondayBreakfast.locked ? '✅' : '❌'}`);

    const allTestsPass = itemsMatch && caloriesMatch && tuesdayDifferent;

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testRegenerateMealWithPreferences(): Promise<boolean> {
  console.log('\n🌱 TEST: Regenerate Meal With Dietary Preferences');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('Step 1: Generate standard day plan...');
    const originalPlan = await service.generateMealPlanForDay({
      date: today,
      targets: SAMPLE_TARGETS,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
    });

    const lunchIndex = originalPlan.meals.findIndex(m => m.type === 'lunch');
    if (lunchIndex === -1) {
      console.log('❌ No lunch meal found');
      return false;
    }

    console.log('Original lunch:', originalPlan.meals[lunchIndex].items.map(i => i.name).join(', '));

    console.log('\nStep 2: Regenerate lunch with vegetarian + no dairy preferences...');
    const preferences: DietaryPreferences = {
      dietType: 'vegetarian',
      avoidIngredients: ['dairy'],
      dislikedFoods: [],
    };

    const updatedPlan = await service.regenerateMeal({
      date: today,
      dayPlan: originalPlan,
      mealIndex: lunchIndex,
      targets: SAMPLE_TARGETS,
      userId: TEST_USER_ID,
      planProfile: 'standard',
      preferences,
    });

    const updatedLunch = updatedPlan.meals[lunchIndex];
    console.log('Updated lunch:', updatedLunch.items.map(i => i.name).join(', '));

    // Validation: Check for meat/fish/dairy
    const meatKeywords = ['chicken', 'beef', 'pork', 'turkey', 'steak', 'bacon', 'sausage', 'fish', 'salmon', 'tuna', 'shrimp'];
    const dairyKeywords = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'whey'];

    const hasMeat = updatedLunch.items.some(item =>
      meatKeywords.some(keyword => item.name.toLowerCase().includes(keyword))
    );

    const hasDairy = updatedLunch.items.some(item =>
      dairyKeywords.some(keyword => item.name.toLowerCase().includes(keyword))
    );

    // Check totals still meet targets
    const updatedTotals = calculateDayTotals(updatedPlan);
    const caloriesValid = validateCalories(updatedTotals.calories, SAMPLE_TARGETS.caloriesPerDay);
    const proteinValid = validateProtein(updatedTotals.protein, SAMPLE_TARGETS.proteinGrams);

    // Check that other meals unchanged
    const breakfastSame = originalPlan.meals[0].items[0].name === updatedPlan.meals[0].items[0].name;

    console.log('\nValidation:');
    console.log(`  - No meat/fish: ${!hasMeat ? '✅' : '❌'}`);
    console.log(`  - No dairy: ${!hasDairy ? '✅' : '❌'}`);
    console.log(`  ${caloriesValid.message}`);
    console.log(`  ${proteinValid.message}`);
    console.log(`  - Other meals unchanged: ${breakfastSame ? '✅' : '❌'}`);

    const allTestsPass = !hasMeat && !hasDairy && caloriesValid.pass && proteinValid.pass && breakfastSame;

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testRegenerateMealBudgetCalculation(): Promise<boolean> {
  console.log('\n💰 TEST: Regenerate Meal Budget Calculation');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('Step 1: Generate initial day plan...');
    const originalPlan = await service.generateMealPlanForDay({
      date: today,
      targets: SAMPLE_TARGETS,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
    });

    // Calculate meal calories
    const mealCalories = originalPlan.meals.map(meal => ({
      type: meal.type,
      calories: meal.items.reduce((sum, item) => sum + item.calories, 0),
    }));

    console.log('\nOriginal meal calories:');
    mealCalories.forEach(m => console.log(`  ${m.type}: ${m.calories} kcal`));

    const lunchIndex = originalPlan.meals.findIndex(m => m.type === 'lunch');
    if (lunchIndex === -1) {
      console.log('❌ No lunch meal found');
      return false;
    }

    const originalLunchCals = mealCalories[lunchIndex].calories;

    // Calculate expected budget for lunch
    const otherMealsCals = mealCalories
      .filter((_, idx) => idx !== lunchIndex)
      .reduce((sum, m) => sum + m.calories, 0);
    const expectedLunchBudget = SAMPLE_TARGETS.caloriesPerDay - otherMealsCals;

    console.log(`\nExpected lunch budget: ${SAMPLE_TARGETS.caloriesPerDay} - ${otherMealsCals} = ${expectedLunchBudget} kcal`);

    console.log('\nStep 2: Regenerate lunch...');
    const updatedPlan = await service.regenerateMeal({
      date: today,
      dayPlan: originalPlan,
      mealIndex: lunchIndex,
      targets: SAMPLE_TARGETS,
      userId: TEST_USER_ID,
      planProfile: 'standard',
    });

    const newLunchCals = updatedPlan.meals[lunchIndex].items.reduce((sum, item) => sum + item.calories, 0);
    const updatedTotals = calculateDayTotals(updatedPlan);

    console.log(`New lunch calories: ${newLunchCals} kcal`);
    console.log(`Updated day total: ${updatedTotals.calories} kcal`);

    // Validation: New lunch should be close to expected budget
    const lunchWithinBudget = Math.abs(newLunchCals - expectedLunchBudget) <= expectedLunchBudget * 0.20; // ±20%
    const dayTotalValid = validateCalories(updatedTotals.calories, SAMPLE_TARGETS.caloriesPerDay);

    console.log('\nValidation:');
    console.log(`  - Lunch within budget (±20%): ${lunchWithinBudget ? '✅' : '❌'} (expected ~${expectedLunchBudget}, got ${newLunchCals})`);
    console.log(`  ${dayTotalValid.message}`);

    const allTestsPass = lunchWithinBudget && dayTotalValid.pass;

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testRegenerateMealInvalidIndex(): Promise<boolean> {
  console.log('\n🚫 TEST: Regenerate Meal Invalid Index');
  console.log('='.repeat(60));

  const service = new RealNutritionAiService();
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('Step 1: Generate day plan...');
    const dayPlan = await service.generateMealPlanForDay({
      date: today,
      targets: SAMPLE_TARGETS,
      userContext: { locale: 'en-US' },
      userId: TEST_USER_ID,
    });

    console.log(`Day has ${dayPlan.meals.length} meals`);

    let testsPassed = 0;
    let totalTests = 2;

    // Test negative index
    console.log('\nTest 1: Negative index (-1)...');
    try {
      await service.regenerateMeal({
        date: today,
        dayPlan,
        mealIndex: -1,
        targets: SAMPLE_TARGETS,
        userId: TEST_USER_ID,
        planProfile: 'standard',
      });
      console.log('❌ Should have thrown error for negative index');
    } catch (error) {
      if (error instanceof NutritionApiError && error.code === 'VALIDATION_ERROR') {
        const hasIndexInMessage = error.message.toLowerCase().includes('index') || error.message.includes('-1');
        console.log(`✅ Correctly rejected negative index`);
        console.log(`  Message: ${error.message}`);
        console.log(`  Code: ${error.code}`);
        console.log(`  Mentions index: ${hasIndexInMessage ? '✅' : '❌'}`);
        if (hasIndexInMessage) testsPassed++;
      } else {
        console.log(`❌ Wrong error type: ${error}`);
      }
    }

    // Test out-of-bounds index
    console.log('\nTest 2: Out-of-bounds index (99)...');
    try {
      await service.regenerateMeal({
        date: today,
        dayPlan,
        mealIndex: 99,
        targets: SAMPLE_TARGETS,
        userId: TEST_USER_ID,
        planProfile: 'standard',
      });
      console.log('❌ Should have thrown error for out-of-bounds index');
    } catch (error) {
      if (error instanceof NutritionApiError && error.code === 'VALIDATION_ERROR') {
        const hasIndexInMessage = error.message.toLowerCase().includes('index') || error.message.includes('99');
        console.log(`✅ Correctly rejected out-of-bounds index`);
        console.log(`  Message: ${error.message}`);
        console.log(`  Code: ${error.code}`);
        console.log(`  Mentions index: ${hasIndexInMessage ? '✅' : '❌'}`);
        if (hasIndexInMessage) testsPassed++;
      } else {
        console.log(`❌ Wrong error type: ${error}`);
      }
    }

    const allTestsPass = testsPassed === totalTests;

    console.log(`\nTests passed: ${testsPassed}/${totalTests}`);

    if (allTestsPass) {
      console.log('\n✅ ALL TESTS PASSED');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
    }

    return allTestsPass;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

async function main() {
  console.log('🧪 Meal Planning AI Test Suite (Quick)');
  console.log('='.repeat(60));
  console.log(`User ID: ${TEST_USER_ID}`);

  // Determine which provider is enabled
  const useOpenAI = process.env.USE_OPENAI === 'true';
  const useOpenRouter = process.env.USE_OPENROUTER === 'true';
  const useOllama = process.env.USE_OLLAMA === 'true';

  let provider = 'Unknown';
  let model = '';
  let apiKeyPresent = false;

  if (useOllama) {
    provider = 'Ollama (Local)';
    model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    apiKeyPresent = true; // Ollama doesn't need API key
  } else if (useOpenRouter) {
    provider = 'OpenRouter';
    model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';
    apiKeyPresent = !!process.env.OPENROUTER_API_KEY;
  } else if (useOpenAI) {
    provider = 'OpenAI';
    model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    apiKeyPresent = !!process.env.OPENAI_API_KEY;
  }

  console.log(`Provider: ${provider}`);
  console.log(`Model: ${model}`);
  console.log(`API Key present: ${apiKeyPresent}`);

  // Initialize database connection
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'coach_nutrition',
  });

  initializeDb(pool);

  try {
    const results = {
      weekPlan: false,
    };

    // Test 2: Generate weekly plan
    results.weekPlan = await testGenerateMealPlanForWeek();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Week Plan: ${results.weekPlan ? '✅ PASS' : '❌ FAIL'}`);

    const allPass = Object.values(results).every(v => v === true);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${allPass ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);

    process.exit(allPass ? 0 : 1);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
