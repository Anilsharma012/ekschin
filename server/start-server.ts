// server/start-server.ts

import { createServer } from "./index";

const app = createServer();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
