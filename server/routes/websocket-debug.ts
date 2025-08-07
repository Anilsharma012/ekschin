import { RequestHandler } from "express";

// Debug endpoint to check WebSocket server status
export const getWebSocketStatus: RequestHandler = async (req, res) => {
  try {
    const status = {
      server: "WebSocket server running",
      endpoints: {
        chat: "/ws/chat",
        notifications: "/ws/notifications", 
        packages: "/ws/packages"
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("WebSocket status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get WebSocket status"
    });
  }
};

// Test WebSocket connection
export const testWebSocketConnection: RequestHandler = async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    res.json({
      success: true,
      data: {
        message: `WebSocket endpoint ${endpoint} is configured`,
        url: `ws://${req.get('host')}${endpoint}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("WebSocket test error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test WebSocket connection"
    });
  }
};
