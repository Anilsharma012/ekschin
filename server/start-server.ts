// server/start-server.ts

import { createServer, initializePushNotifications } from "./index";

const app = createServer();
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);

  // Initialize push notifications
  initializePushNotifications(server);
});
