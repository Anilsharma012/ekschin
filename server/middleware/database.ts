import { RequestHandler } from "express";
import { getDatabase, connectToDatabase } from "../db/mongodb";

// Middleware to ensure database is ready before handling requests
export const ensureDatabase: RequestHandler = async (req, res, next) => {
  try {
    // Try to get database connection
    getDatabase();
    next();
  } catch (error) {
    console.log("🔄 Database not ready, initializing connection...");
    
    try {
      // Attempt to connect to database
      await connectToDatabase();
      console.log("✅ Database connection established via middleware");
      next();
    } catch (dbError) {
      console.error("❌ Database connection failed in middleware:", dbError);
      
      // Return service unavailable with retry info
      res.status(503).json({
        success: false,
        error: "Database connection unavailable",
        message: "Service is starting up, please try again in a few seconds",
        retryAfter: 5 // Suggest retry after 5 seconds
      });
    }
  }
};

// Health check middleware for database status
export const databaseHealthCheck: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    
    // Simple ping to verify database is responsive
    await db.admin().ping();
    
    req.databaseStatus = {
      connected: true,
      responsive: true,
      timestamp: new Date()
    };
    
    next();
  } catch (error) {
    req.databaseStatus = {
      connected: false,
      responsive: false,
      error: error.message,
      timestamp: new Date()
    };
    
    next();
  }
};

// Extend Request interface to include database status
declare global {
  namespace Express {
    interface Request {
      databaseStatus?: {
        connected: boolean;
        responsive: boolean;
        error?: string;
        timestamp: Date;
      };
    }
  }
}
