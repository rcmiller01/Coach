import http from 'http';

const data = JSON.stringify({
    text: "6 inch subway italian",
    city: "New York",
    zipCode: "10001",
    locale: "en-US"
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/nutrition/parse-food',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            const json = JSON.parse(body);
            console.log('Error Details:', json.details);
            console.log('Error Stack:', json.stack);
        } catch (e) {
            console.log('Raw Body:', body);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
