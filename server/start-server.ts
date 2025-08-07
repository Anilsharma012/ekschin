// server/start-server.ts

import { createServer, initializePushNotifications, initializePackageSync } from "./index";
import { ChatWebSocketServer } from "./websocket";
import { connectToDatabase } from "./db/mongodb";

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    // Initialize database connection first
    console.log("🔄 Initializing database connection...");
    await connectToDatabase();
    console.log("✅ Database connection established");

    // Create and start the server
    const app = createServer();
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log("🚀 All services ready to accept requests");
    });

    // Initialize services after server is running
    initializePushNotifications(server);
    initializePackageSync(server);

    // Initialize chat WebSocket server
    const chatWS = new ChatWebSocketServer(server);
    console.log('💬 Chat WebSocket server initialized');

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.log("🔄 Retrying in 5 seconds...");

    // Retry after 5 seconds
    setTimeout(startServer, 5000);
  }
}

// Start the server
startServer();
