/**
 * Phase 4: Quota Testing
 * 
 * Test real database-backed quota enforcement:
 * - Daily limit (100 parses/day)
 * - Per-minute rate limiting (10/min)
 * - AI kill switch (ai_enabled)
 */

import { RealNutritionAiService } from './RealNutritionAiService.js';
import * as quotaService from './quotaService.js';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDailyQuota() {
  console.log('\n🧪 TEST 1: Daily Quota Enforcement');
  console.log('=' .repeat(60));
  
  const testUserId = `quota-test-${Date.now()}`;
  const service = new RealNutritionAiService();
  
  // Set a very low limit for testing
  console.log(`Setting test user to have 2 parses remaining...`);
  
  const today = new Date().toISOString().split('T')[0];
  await pool.query(
    `INSERT INTO user_ai_usage_daily (user_id, date, parse_food_calls)
     VALUES ($1, $2, ${quotaService.DAILY_PARSE_LIMIT - 2})
     ON CONFLICT (user_id, date) DO UPDATE
     SET parse_food_calls = ${quotaService.DAILY_PARSE_LIMIT - 2}`,
    [testUserId, today]
  );
  
  try {
    // Parse 1 - should succeed
    console.log('\n📝 Parse 1: Should succeed...');
    const result1 = await service.parseFood({
      text: 'Big Mac',
      userId: testUserId,
      userContext: {},
    });
    console.log(`✅ Parse 1 succeeded: ${result1.name} (${result1.calories} cal)`);
    
    // Parse 2 - should succeed
    console.log('\n📝 Parse 2: Should succeed...');
    const result2 = await service.parseFood({
      text: '6oz chicken breast',
      userId: testUserId,
      userContext: {},
    });
    console.log(`✅ Parse 2 succeeded: ${result2.name} (${result2.calories} cal)`);
    
    // Parse 3 - should FAIL with quota exceeded
    console.log('\n📝 Parse 3: Should FAIL with quota exceeded...');
    try {
      await service.parseFood({
        text: 'Subway Italian BMT',
        userId: testUserId,
        userContext: {},
      });
      console.log('❌ TEST FAILED: Parse 3 should have been blocked by quota');
      return false;
    } catch (error: unknown) {
      const err = error as { code?: string; message: string; retryable?: boolean };
      if (err.code === 'AI_QUOTA_EXCEEDED') {
        console.log(`✅ Parse 3 correctly blocked: ${err.message}`);
        console.log(`   Retryable: ${err.retryable}`);
        return true;
      } else {
        console.log(`❌ Wrong error type: ${err.code || err.message}`);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
    return false;
  }
}

async function testRateLimit() {
  console.log('\n🧪 TEST 2: Per-Minute Rate Limiting');
  console.log('='.repeat(60));
  
  const testUserId = `rate-test-${Date.now()}`;
  
  console.log(`Rate limit: ${quotaService.PER_MINUTE_RATE_LIMIT} calls per minute`);
  console.log(`Testing with ${quotaService.PER_MINUTE_RATE_LIMIT + 2} rapid calls...`);
  
  let successCount = 0;
  let rateLimitCount = 0;
  
  for (let i = 0; i < quotaService.PER_MINUTE_RATE_LIMIT + 2; i++) {
    try {
      await quotaService.checkAndIncrementQuota(testUserId);
      successCount++;
      console.log(`  Call ${i + 1}: ✅ Allowed`);
    } catch (error: unknown) {
      const err = error as { message: string };
      if (err.message === 'AI_RATE_LIMITED') {
        rateLimitCount++;
        console.log(`  Call ${i + 1}: 🚫 Rate limited`);
      } else {
        console.log(`  Call ${i + 1}: ❌ Unexpected error: ${err.message}`);
      }
    }
  }
  
  console.log(`\nResults:`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Rate limited: ${rateLimitCount}`);
  
  if (successCount === quotaService.PER_MINUTE_RATE_LIMIT && rateLimitCount === 2) {
    console.log(`✅ Rate limiting works correctly`);
    return true;
  } else {
    console.log(`❌ Rate limiting failed - expected ${quotaService.PER_MINUTE_RATE_LIMIT} success, 2 blocked`);
    return false;
  }
}

async function testKillSwitch() {
  console.log('\n🧪 TEST 3: Admin Kill Switch (ai_enabled)');
  console.log('='.repeat(60));
  
  const testUserId = `killswitch-test-${Date.now()}`;
  const service = new RealNutritionAiService();
  
  // Create user with AI disabled
  console.log('Creating user with ai_enabled = false...');
  await pool.query(
    'INSERT INTO users (id, ai_enabled) VALUES ($1, false) ON CONFLICT (id) DO UPDATE SET ai_enabled = false',
    [testUserId]
  );
  
  try {
    console.log('\n📝 Attempting to parse with AI disabled...');
    await service.parseFood({
      text: '1 apple',
      userId: testUserId,
      userContext: {},
    });
    
    console.log('❌ TEST FAILED: Should have been blocked by kill switch');
    return false;
    
  } catch (error: unknown) {
    const err = error as { code?: string; message: string; retryable?: boolean };
    if (err.code === 'AI_DISABLED_FOR_USER') {
      console.log(`✅ Kill switch working: ${err.message}`);
      console.log(`   Retryable: ${err.retryable}`);
      
      // Re-enable and try again
      console.log('\n📝 Re-enabling AI for user...');
      await pool.query(
        'UPDATE users SET ai_enabled = true WHERE id = $1',
        [testUserId]
      );
      
      console.log('📝 Attempting parse again...');
      const result = await service.parseFood({
        text: 'Big Mac',
        userId: testUserId,
        userContext: {},
      });
      
      console.log(`✅ Parse succeeded after re-enabling: ${result.name}`);
      return true;
      
    } else {
      console.log(`❌ Wrong error type: ${err.code || err.message}`);
      return false;
    }
  }
}

async function testUsageLogging() {
  console.log('\n🧪 TEST 4: Usage Event Logging');
  console.log('='.repeat(60));
  
  const testUserId = `logging-test-${Date.now()}`;
  const service = new RealNutritionAiService();
  
  // Clear any existing events for this user
  await pool.query('DELETE FROM parse_food_events WHERE user_id = $1', [testUserId]);
  
  // Successful parse
  console.log('\n📝 Parse 1: Successful');
  await service.parseFood({
    text: 'Big Mac',
    userId: testUserId,
    userContext: {},
  });
  
  // Failed parse (nonsense)
  console.log('\n📝 Parse 2: Should fail (nonsense)');
  try {
    await service.parseFood({
      text: 'three feelings and a dream',
      userId: testUserId,
      userContext: {},
    });
  } catch {
    // Expected to fail
  }
  
  // Check logged events
  const eventsResult = await pool.query(
    'SELECT * FROM parse_food_events WHERE user_id = $1 ORDER BY timestamp',
    [testUserId]
  );
  
  console.log(`\n📊 Logged events: ${eventsResult.rows.length}`);
  
  for (const event of eventsResult.rows) {
    console.log(`\n  Event ${event.id}:`);
    console.log(`    Text hash: ${event.text_hash?.substring(0, 16)}...`);
    console.log(`    Error code: ${event.error_code || 'null (success)'}`);
    console.log(`    Provenance: ${event.provenance || 'n/a'}`);
    console.log(`    Confidence: ${event.confidence || 'n/a'}`);
    console.log(`    Calories: ${event.calories || 'n/a'}`);
    console.log(`    Duration: ${event.duration_ms}ms`);
  }
  
  if (eventsResult.rows.length === 2) {
    console.log('\n✅ Logging works correctly');
    return true;
  } else {
    console.log(`\n❌ Expected 2 events, got ${eventsResult.rows.length}`);
    return false;
  }
}

async function main() {
  console.log('🛡️  PHASE 4: QUOTA & LOGGING TESTS\n');
  
  const results = {
    dailyQuota: false,
    rateLimit: false,
    killSwitch: false,
    logging: false,
  };
  
  try {
    results.dailyQuota = await testDailyQuota();
    results.rateLimit = await testRateLimit();
    results.killSwitch = await testKillSwitch();
    results.logging = await testUsageLogging();
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Daily Quota:     ${results.dailyQuota ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Rate Limiting:   ${results.rateLimit ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Kill Switch:     ${results.killSwitch ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Usage Logging:   ${results.logging ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
