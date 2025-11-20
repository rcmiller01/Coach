// Minimal debug server - no OpenAI, no routes, just Express
import express from "express";

console.log("Starting minimal debug server...");

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
  console.error("Stack:", err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
});

const app = express();

app.get("/health", (_req, res) => {
  console.log("✅ Health check hit!");
  res.send("ok from debug server");
});

const port = 4000; // Try a different port
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Debug server listening on 0.0.0.0:${port}`);
  console.log("Server object:", !!server);
  console.log("Listening:", server.listening);
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
});

server.on("close", () => {
  console.log("⚠️ Server closed");
});

// Keep alive
setInterval(() => {
  console.log("💓 Server still alive...");
}, 2000);
