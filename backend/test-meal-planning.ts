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
import type { NutritionTargets, DayPlan } from '../src/features/nutrition/nutritionTypes';
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
// RUN TESTS
// ============================================================================

async function main() {
  console.log('🧪 Meal Planning AI Test Suite');
  console.log('='.repeat(60));
  console.log(`User ID: ${TEST_USER_ID}`);
  console.log(`Model: ${process.env.USE_OPENROUTER === 'true' ? process.env.OPENROUTER_MODEL : process.env.OPENAI_MODEL}`);
  
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
      dayPlan: false,
      weekPlan: false,
      glp1Feasible: false,
      glp1Infeasible: false,
    };
    
    // Test 1: Generate single day plan
    results.dayPlan = await testGenerateMealPlanForDay();
    
    // Test 2: Generate weekly plan
    results.weekPlan = await testGenerateMealPlanForWeek();
    
    // Test 3: GLP-1 feasible plan
    results.glp1Feasible = await testGLP1FeasiblePlan();
    
    // Test 4: GLP-1 infeasible plan (should reject)
    results.glp1Infeasible = await testGLP1InfeasiblePlan();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Day Plan: ${results.dayPlan ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Week Plan: ${results.weekPlan ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`GLP-1 Feasible: ${results.glp1Feasible ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`GLP-1 Infeasible Rejection: ${results.glp1Infeasible ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPass = results.dayPlan && results.weekPlan && results.glp1Feasible && results.glp1Infeasible;
    console.log(`\nOverall: ${allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    process.exit(allPass ? 0 : 1);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
