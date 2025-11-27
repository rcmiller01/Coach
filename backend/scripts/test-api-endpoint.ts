
import fetch from 'node-fetch';

async function testApi() {
    try {
        console.log('Testing POST /api/nutrition/plan/week...');

        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/api/nutrition/plan/week`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'test-user-id' // Assuming auth middleware uses this or similar
            },
            body: JSON.stringify({
                weekStartDate: new Date().toISOString().split('T')[0],
                targets: {
                    caloriesPerDay: 2000,
                    proteinGrams: 150,
                    carbsGrams: 200,
                    fatGrams: 65
                },
                userContext: { locale: 'en-US' }
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            console.error(`Response: ${text}`);
        } else {
            const data = await response.json();
            console.log('✅ API Success!');
            console.log(`Generated ${data.days?.length} days`);
        }

    } catch (err) {
        console.error('❌ Network Error:', err);
    }
}

testApi();
