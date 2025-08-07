// server/start-server.ts

import { createServer, initializePushNotifications, initializePackageSync } from "./index";
import { ChatWebSocketServer } from "./websocket";

const app = createServer();
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);

  // Initialize services
  initializePushNotifications(server);
  initializePackageSync(server);

  // Initialize chat WebSocket server
  const chatWS = new ChatWebSocketServer(server);
  console.log('💬 Chat WebSocket server initialized');
});
