const https = require('node:https');

https.get('https://bandup-ielts.onrender.com/api/test-keys', (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('--- TEST KEYS DIAGNOSTICS ---');
    console.log('Status:', res.statusCode);
    try {
      const data = JSON.parse(body);
      console.log(JSON.stringify(data, null, 2));
    } catch {
      console.log('Response (not JSON):', body);
    }
  });
}).on('error', (err) => {
  console.error('Request Error:', err);
});
