// Pure JavaScript server - no TypeScript, no tsx
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  console.log('✅ Health check hit!');
  res.json({ status: 'ok' });
});

const port = 4000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Pure JS server listening on 0.0.0.0:${port}`);
  console.log('Server object exists:', !!server);
  console.log('Server is listening:', server.listening);
});

// Keep alive
setInterval(() => {
  console.log('💓 Pure JS server still alive...', new Date().toLocaleTimeString());
}, 2000);

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION:', err);
});

server.on('error', (err) => {
  console.error('💥 SERVER ERROR:', err);
});
