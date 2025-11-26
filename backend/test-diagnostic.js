/**
 * Simple diagnostic test - writes results to file
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001';
const OUTPUT_FILE = path.join(__dirname, '../test-results.txt');

async function runDiagnostics() {
    const results = [];

    results.push('='.repeat(60));
    results.push('AUTOMATED TEST RESULTS');
    results.push('='.repeat(60));
    results.push('');

    try {
        // Test 1: Health check
        results.push('TEST 1: Health Check');
        const healthResp = await fetch(`${API_BASE}/health`);
        const healthData = await healthResp.json();
        results.push(`  Status: ${healthResp.status}`);
        results.push(`  Response: ${JSON.stringify(healthData)}`);
        results.push(`  Result: ${healthResp.ok ? '✅ PASS' : '❌ FAIL'}`);
        results.push('');

        // Test 2: Generate daily plan
        results.push('TEST 2: Generate Daily Plan');
        const dailyResp = await fetch(`${API_BASE}/api/nutrition/plan/day`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': 'test-user',
            },
            body: JSON.stringify({
                date: '2025-01-23',
                targets: {
                    caloriesPerDay: 2000,
                    proteinGrams: 150,
                    carbsGrams: 200,
                    fatGrams: 70,
                },
            }),
        });

        const dailyData = await dailyResp.json();
        results.push(`  Status: ${dailyResp.status}`);
        results.push(`  Has data: ${dailyData.data ? 'Yes' : 'No'}`);
        if (dailyData.data) {
            results.push(`  Date: ${dailyData.data.date}`);
            results.push(`  Meals: ${dailyData.data.meals?.length || 0}`);
        }
        if (dailyData.error) {
            results.push(`  Error: ${JSON.stringify(dailyData.error)}`);
        }
        results.push(`  Result: ${dailyResp.ok ? '✅ PASS' : '❌ FAIL'}`);
        results.push('');

        // Test 3: Copy day plan
        results.push('TEST 3: Copy Day Plan');
        const copyResp = await fetch(`${API_BASE}/api/nutrition/plan/copy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': 'test-user',
            },
            body: JSON.stringify({
                fromDate: '2025-01-23',
                toDate: '2025-01-24',
            }),
        });

        const copyData = await copyResp.json();
        results.push(`  Status: ${copyResp.status}`);
        results.push(`  Has data: ${copyData.data ? 'Yes' : 'No'}`);
        if (copyData.data) {
            results.push(`  Date: ${copyData.data.date}`);
            results.push(`  Meals copied: ${copyData.data.meals?.length || 0}`);
        }
        if (copyData.error) {
            results.push(`  Error: ${JSON.stringify(copyData.error)}`);
        }
        results.push(`  Result: ${copyResp.ok ? '✅ PASS' : '❌ FAIL'}`);
        results.push('');

    } catch (error) {
        results.push(`❌ ERROR: ${error.message}`);
        results.push(`Stack: ${error.stack}`);
    }

    results.push('='.repeat(60));

    const output = results.join('\n');
    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(output);
    console.log(`\nResults written to: ${OUTPUT_FILE}`);
}

runDiagnostics().catch(console.error);
