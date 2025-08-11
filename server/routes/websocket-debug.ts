import { RequestHandler } from "express";
import { pushNotificationService } from "../services/pushNotificationService";

// Debug endpoint to check WebSocket server status
export const getWebSocketStatus: RequestHandler = async (req, res) => {
  try {
    const connectedUsers = pushNotificationService.getConnectedUsers();
    
    res.json({
      success: true,
      data: {
        pushNotificationService: {
          connectedUsers: connectedUsers.length,
          userIds: connectedUsers,
          isInitialized: true
        },
        serverInfo: {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          env: process.env.NODE_ENV
        }
      }
    });

  } catch (error) {
    console.error("❌ WebSocket status check failed:", error);
    res.status(500).json({
      success: false,
      error: "WebSocket status check failed",
      details: error.message
    });
  }
};

// Test WebSocket connectivity
export const testWebSocketConnection: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    const isConnected = pushNotificationService.isUserConnected(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        isConnected,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ WebSocket connection test failed:", error);
    res.status(500).json({
      success: false,
      error: "WebSocket connection test failed",
      details: error.message
    });
  }
};
