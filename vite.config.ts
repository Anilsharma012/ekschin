import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// ✅ Final working config
export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    plugins: [react(), isDev ? expressPlugin() : undefined].filter(Boolean),

    build: {
      outDir: "client/dist", // ✅ Output still goes to client/dist for Netlify
      emptyOutDir: true,
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },

    server: {
      port: 5173,
    },
  };
});

// ✅ Dev plugin (Express middleware for dev)
function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);

      // Initialize WebSocket services for development
      server.httpServer?.on('listening', () => {
        try {
          const { initializePushNotifications, initializePackageSync } = require("./server");
          initializePushNotifications(server.httpServer);
          initializePackageSync(server.httpServer);
          console.log('✅ WebSocket services initialized for development');
        } catch (error) {
          console.error('❌ Failed to initialize WebSocket services:', error);
        }
      });
    },
  };
}
