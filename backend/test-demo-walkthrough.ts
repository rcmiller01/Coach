/**
 * Automated Demo Walkthrough
 * Tests the newly implemented API client functions
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`✅ ${message}`);
        testsPassed++;
    } else {
        console.error(`❌ ${message}`);
        testsFailed++;
    }
}

async function testHealthCheck() {
    console.log('\n🏥 Testing Health Endpoint...');
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json() as any;
        assert(response.ok, 'Health check returned 200');
        assert(data.status === 'ok', 'Health check status is ok');
    } catch (error) {
        console.error(`❌ Health check failed: ${error}`);
        testsFailed++;
        throw error;
    }
}

async function testGenerateDailyPlan() {
    console.log('\n📅 Testing generateMealPlanForDay endpoint...');
    try {
        const response = await fetch(`${API_BASE}/api/nutrition/plan/day`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': 'test-user',
            },
            body: JSON.stringify({
                date: '2025-01-20',
                targets: {
                    caloriesPerDay: 2000,
                    proteinGrams: 150,
                    carbsGrams: 200,
                    fatGrams: 70,
                },
                userContext: {
                    city: 'Seattle',
                    locale: 'en-US',
                },
            }),
        });

        assert(response.ok, 'Daily plan generation returned success');

        const result = await response.json() as any;
        assert(result.data !== undefined, 'Response has data field');
        assert(result.data.date === '2025-01-20', 'Day plan has correct date');
        assert(Array.isArray(result.data.meals), 'Day plan has meals array');
        console.log(`   Generated ${result.data.meals.length} meals`);
    } catch (error) {
        console.error(`❌ Daily plan generation failed: ${error}`);
        testsFailed++;
    }
}

async function testCopyDayPlan() {
    console.log('\n📋 Testing copyDayPlan endpoint...');
    try {
        // First, create a plan for the source day
        console.log('   Creating source plan...');
        await fetch(`${API_BASE}/api/nutrition/plan/day`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': 'test-user',
            },
            body: JSON.stringify({
                date: '2025-01-21',
                targets: {
                    caloriesPerDay: 2000,
                    proteinGrams: 150,
                    carbsGrams: 200,
                    fatGrams: 70,
                },
            }),
        });

        // Now test copying
        console.log('   Copying to destination...');
        const response = await fetch(`${API_BASE}/api/nutrition/plan/copy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': 'test-user',
            },
            body: JSON.stringify({
                fromDate: '2025-01-21',
                toDate: '2025-01-22',
            }),
        });

        assert(response.ok, 'Copy day plan returned success');

        const result = await response.json() as any;
        assert(result.data !== undefined, 'Response has data field');
        assert(result.data.date === '2025-01-22', 'Copied plan has correct date');
        assert(Array.isArray(result.data.meals), 'Copied plan has meals array');
        assert(result.data.meals.length > 0, 'Copied plan has meals (not empty)');
        console.log(`   Copied ${result.data.meals.length} meals to destination`);
    } catch (error) {
        console.error(`❌ Copy day plan failed: ${error}`);
        testsFailed++;
    }
}

async function runTests() {
    console.log('🚀 Starting Automated Demo Walkthrough\n');
    console.log('='.repeat(60));

    try {
        await testHealthCheck();
        await testGenerateDailyPlan();
        await testCopyDayPlan();
    } catch (error) {
        console.error('\n💥 Test suite failed to complete:', error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results:');
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log('='.repeat(60));

    if (testsFailed > 0) {
        console.log('\n⚠️  Some tests failed.');
        process.exit(1);
    } else {
        console.log('\n✨ All automated tests passed! Ready for live demo.');
        process.exit(0);
    }
}

// Check if server is running before tests
console.log(`📡 Checking if backend server is running on ${API_BASE}...\n`);
fetch(`${API_BASE}/health`)
    .then(() => {
        console.log('✅ Backend server is ready!\n');
        runTests();
    })
    .catch(() => {
        console.error('❌ Backend server is not running!');
        console.error('   Please start the server first:');
        console.error('   1. Open a terminal');
        console.error('   2. Run: cd backend && npx tsx server.ts');
        console.error('   3. Wait for "Server running" message');
        console.error('   4. Then run this test again\n');
        process.exit(1);
    });
