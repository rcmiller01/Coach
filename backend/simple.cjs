// Pure CommonJS server
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  console.log('✅ Health check hit!');
  res.json({ status: 'ok' });
});

const port = 4000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ CJS server listening on 0.0.0.0:${port}`);
});

setInterval(() => console.log('💓 Alive...'), 2000);

process.on('uncaughtException', (err) => console.error('💥 Exception:', err));
process.on('unhandledRejection', (err) => console.error('💥 Rejection:', err));
server.on('error', (err) => console.error('💥 Server error:', err));
