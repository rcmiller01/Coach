/**
 * Contract Tests for Nutrition API
 * 
 * These tests validate that the API client and backend stubs have matching contracts.
 * Run these BEFORE implementing real AI to ensure type safety across the boundary.
 * 
 * Usage:
 *   npx tsx tests/contractTests.ts
 * 
 * Philosophy: "Until the stubs are contract-perfect, wiring a real LLM 
 * just means debugging two things at once."
 */

import type {
  WeeklyPlan,
  DayPlan,
  DayLog,
  LoggedFoodItem,
  NutritionTargets,
  UserContext,
  ApiErrorResponse,
  ConfidenceLevel,
} from '../src/features/nutrition/nutritionTypes';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ ${message}`);
    testsFailed++;
  }
}

function assertDefined<T>(value: T | null | undefined, fieldName: string): void {
  assert(value !== null && value !== undefined, `${fieldName} must be defined`);
}

function assertType(value: unknown, expectedType: string, fieldName: string): void {
  assert(typeof value === expectedType, `${fieldName} must be ${expectedType}, got ${typeof value}`);
}

function assertOneOf<T>(value: T, options: T[], fieldName: string): void {
  assert(options.includes(value), `${fieldName} must be one of [${options.join(', ')}], got ${value}`);
}

function assertArrayLength(arr: unknown[], minLength: number, fieldName: string): void {
  assert(arr.length >= minLength, `${fieldName} must have at least ${minLength} items, got ${arr.length}`);
}

// ============================================================================
// CONTRACT VALIDATORS
// ============================================================================

function validateWeeklyPlan(plan: WeeklyPlan): void {
  console.log('\n📋 Validating WeeklyPlan...');
  
  assertDefined(plan.weekStartDate, 'weekStartDate');
  assertType(plan.weekStartDate, 'string', 'weekStartDate');
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(plan.weekStartDate),
    'weekStartDate must be YYYY-MM-DD format'
  );
  
  assertDefined(plan.days, 'days');
  assert(Array.isArray(plan.days), 'days must be an array');
  
  if (plan.days.length > 0) {
    assert(plan.days.length <= 7, 'days must have at most 7 items');
    plan.days.forEach((day, i) => validateDayPlan(day, `days[${i}]`));
  }
}

function validateDayPlan(day: DayPlan, context = 'DayPlan'): void {
  assertDefined(day.date, `${context}.date`);
  assertType(day.date, 'string', `${context}.date`);
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(day.date),
    `${context}.date must be YYYY-MM-DD format`
  );
  
  assertDefined(day.meals, `${context}.meals`);
  assert(Array.isArray(day.meals), `${context}.meals must be an array`);
  
  day.meals.forEach((meal, i) => {
    assertDefined(meal.id, `${context}.meals[${i}].id`);
    assertDefined(meal.type, `${context}.meals[${i}].type`);
    assertOneOf(
      meal.type,
      ['breakfast', 'lunch', 'dinner', 'snack'],
      `${context}.meals[${i}].type`
    );
    
    assertDefined(meal.items, `${context}.meals[${i}].items`);
    assert(Array.isArray(meal.items), `${context}.meals[${i}].items must be an array`);
    
    meal.items.forEach((item, j) => {
      validatePlannedFoodItem(item, `${context}.meals[${i}].items[${j}]`);
    });
  });
}

function validatePlannedFoodItem(item: any, context: string): void {
  assertDefined(item.id, `${context}.id`);
  assertDefined(item.name, `${context}.name`);
  assertType(item.name, 'string', `${context}.name`);
  
  assertDefined(item.quantity, `${context}.quantity`);
  assertType(item.quantity, 'number', `${context}.quantity`);
  assert(item.quantity > 0, `${context}.quantity must be > 0`);
  
  assertDefined(item.unit, `${context}.unit`);
  assertOneOf(
    item.unit,
    ['g', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'serving'],
    `${context}.unit`
  );
  
  // Validate macros
  ['calories', 'proteinGrams', 'carbsGrams', 'fatsGrams'].forEach(macro => {
    assertDefined(item[macro], `${context}.${macro}`);
    assertType(item[macro], 'number', `${context}.${macro}`);
    assert(item[macro] >= 0, `${context}.${macro} must be >= 0`);
  });
}

function validateDayLog(log: DayLog): void {
  console.log('\n📋 Validating DayLog...');
  
  assertDefined(log.date, 'date');
  assertType(log.date, 'string', 'date');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(log.date), 'date must be YYYY-MM-DD format');
  
  assertDefined(log.items, 'items');
  assert(Array.isArray(log.items), 'items must be an array');
  
  log.items.forEach((item, i) => validateLoggedFoodItem(item, `items[${i}]`));
  
  // Validate totals
  ['totalCalories', 'totalProteinGrams', 'totalCarbsGrams', 'totalFatsGrams'].forEach(total => {
    assertDefined(log[total as keyof DayLog], total);
    assertType(log[total as keyof DayLog], 'number', total);
    assert(log[total as keyof DayLog] >= 0, `${total} must be >= 0`);
  });
}

function validateLoggedFoodItem(item: LoggedFoodItem, context: string): void {
  // Validate base food item fields
  validatePlannedFoodItem(item, context);
  
  // Validate sourceType
  assertDefined(item.sourceType, `${context}.sourceType`);
  assertOneOf(
    item.sourceType,
    ['plan', 'search', 'manual'],
    `${context}.sourceType`
  );
  
  // Validate userAdjusted
  assertDefined(item.userAdjusted, `${context}.userAdjusted`);
  assertType(item.userAdjusted, 'boolean', `${context}.userAdjusted`);
  
  // Validate dataSource
  assertDefined(item.dataSource, `${context}.dataSource`);
  assertOneOf(
    item.dataSource,
    ['official', 'estimated'],
    `${context}.dataSource`
  );
  
  // Validate user correction tracking
  if (item.userAdjusted) {
    // If user adjusted, original values should be present
    assert(
      item.originalCalories !== undefined ||
      item.originalProteinGrams !== undefined ||
      item.originalCarbsGrams !== undefined ||
      item.originalFatsGrams !== undefined,
      `${context}: userAdjusted=true but no original* fields set`
    );
  }
  
  // Validate AI explanation (if present)
  if (item.aiExplanation) {
    validateAiExplanation(item.aiExplanation, `${context}.aiExplanation`);
  }
}

function validateAiExplanation(explanation: any, context: string): void {
  assertDefined(explanation.reasoning, `${context}.reasoning`);
  assertType(explanation.reasoning, 'string', `${context}.reasoning`);
  assert(explanation.reasoning.length > 0, `${context}.reasoning must be non-empty`);
  
  assertDefined(explanation.sources, `${context}.sources`);
  assert(Array.isArray(explanation.sources), `${context}.sources must be an array`);
  assertArrayLength(explanation.sources, 1, `${context}.sources`);
  
  explanation.sources.forEach((source: any, i: number) => {
    assertDefined(source.label, `${context}.sources[${i}].label`);
    assertType(source.label, 'string', `${context}.sources[${i}].label`);
    
    // url is optional, but if present must be string or undefined
    if (source.url !== undefined) {
      assertType(source.url, 'string', `${context}.sources[${i}].url`);
    }
  });
  
  assertDefined(explanation.confidence, `${context}.confidence`);
  assertOneOf(
    explanation.confidence,
    ['low', 'medium', 'high'] as ConfidenceLevel[],
    `${context}.confidence`
  );
}

function validateErrorResponse(error: ApiErrorResponse): void {
  console.log('\n📋 Validating ErrorResponse...');
  
  assertDefined(error.error, 'error');
  assertDefined(error.error.code, 'error.code');
  assertType(error.error.code, 'string', 'error.code');
  
  assertDefined(error.error.message, 'error.message');
  assertType(error.error.message, 'string', 'error.message');
  assert(error.error.message.length > 0, 'error.message must be non-empty');
  
  assertDefined(error.error.retryable, 'error.retryable');
  assertType(error.error.retryable, 'boolean', 'error.retryable');
}

// ============================================================================
// STUB TESTS
// ============================================================================

async function testParseFoodSimple(): Promise<void> {
  console.log('\n🧪 Test: parseFood("1 apple")');
  
  // Import the API client
  const { parseFood } = await import('../src/api/nutritionApiClient.v2.js');
  
  const result = await parseFood('1 apple');
  validateLoggedFoodItem(result, 'parseFood result');
  
  // Additional assertions for this specific case
  assert(result.name.length > 0, 'name must be non-empty');
  assert(result.dataSource === 'official' || result.dataSource === 'estimated', 'dataSource must be valid');
}

async function testParseFoodMultiItem(): Promise<void> {
  console.log('\n🧪 Test: parseFood("2 eggs and a slice of toast")');
  
  const { parseFood } = await import('../src/api/nutritionApiClient.v2.js');
  
  const result = await parseFood('2 eggs and a slice of toast');
  validateLoggedFoodItem(result, 'parseFood result');
}

async function testParseFoodAmbiguous(): Promise<void> {
  console.log('\n🧪 Test: parseFood("my usual from Subway")');
  
  const { parseFood } = await import('../src/api/nutritionApiClient.v2.js');
  
  const userContext: UserContext = {
    city: 'Seattle',
    zipCode: '98101',
  };
  
  const result = await parseFood('my usual from Subway', userContext);
  validateLoggedFoodItem(result, 'parseFood result');
  
  // For ambiguous queries, confidence should be low
  if (result.aiExplanation) {
    assert(
      result.aiExplanation.confidence === 'low',
      'Ambiguous query should have low confidence'
    );
  }
}

async function testGenerateWeeklyPlan(): Promise<void> {
  console.log('\n🧪 Test: generateMealPlanForWeek');
  
  const { generateMealPlanForWeek } = await import('../src/api/nutritionApiClient.v2.js');
  
  const targets: NutritionTargets = {
    caloriesPerDay: 2000,
    proteinGrams: 150,
    carbsGrams: 200,
    fatGrams: 70,
  };
  
  const result = await generateMealPlanForWeek('2025-01-13', targets);
  validateWeeklyPlan(result);
  
  // Should have 7 days
  if (result.days.length > 0) {
    assert(result.days.length === 7, 'Weekly plan should have 7 days');
  }
}

async function testFetchDayLog(): Promise<void> {
  console.log('\n🧪 Test: fetchDayLog');
  
  const { fetchDayLog } = await import('../src/api/nutritionApiClient.v2.js');
  
  const result = await fetchDayLog('2025-01-13');
  validateDayLog(result);
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

async function testErrorResponse(): Promise<void> {
  console.log('\n🧪 Test: Error Response Shape');
  
  // Create a mock error response
  const mockError: ApiErrorResponse = {
    error: {
      code: 'AI_TIMEOUT',
      message: 'The AI service took too long to respond. Please try again.',
      retryable: true,
    },
  };
  
  validateErrorResponse(mockError);
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Contract Tests...\n');
  console.log('=' .repeat(60));
  
  try {
    await testParseFoodSimple();
    await testParseFoodMultiItem();
    await testParseFoodAmbiguous();
    await testGenerateWeeklyPlan();
    await testFetchDayLog();
    await testErrorResponse();
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    testsFailed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log('=' .repeat(60));
  
  if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed. Fix the contracts before implementing real AI.');
    process.exit(1);
  } else {
    console.log('\n✨ All tests passed! Contracts are validated.');
    process.exit(0);
  }
}

// Run tests if this file is executed directly
runAllTests();
