import { Request, Response } from 'express';
import { pushNotificationService } from '../services/pushNotificationService';

export const testPushNotification = async (req: Request, res: Response) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, and message are required'
      });
    }

    // Send test notification
    const result = await pushNotificationService.sendPushNotification(
      [userId], 
      title, 
      message, 
      type as 'info' | 'success' | 'warning' | 'error'
    );

    res.json({
      success: true,
      result,
      message: 'Test notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending test push notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const getPushNotificationStats = (req: Request, res: Response) => {
  try {
    const connectedUsers = pushNotificationService.getConnectedUsers();
    
    res.json({
      success: true,
      stats: {
        connectedUsers: connectedUsers.length,
        userIds: connectedUsers
      }
    });

  } catch (error) {
    console.error('Error getting push notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const testUserConnection = (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const isConnected = pushNotificationService.isUserConnected(userId);
    
    res.json({
      success: true,
      userId,
      isConnected
    });

  } catch (error) {
    console.error('Error checking user connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check connection',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};
