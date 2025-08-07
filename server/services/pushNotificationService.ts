import { WebSocketServer } from 'ws';
import { getDatabase } from '../db/mongodb';

interface PushNotification {
  id: string;
  title: string;
  message: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface ConnectedClient {
  ws: any;
  userId: string;
  userType: string;
}

class PushNotificationService {
  private clients: Map<string, ConnectedClient> = new Map();
  private wss: WebSocketServer | null = null;

  initialize(server: any) {
    try {
      this.wss = new WebSocketServer({
        server,
        path: '/ws/notifications'
      });

      console.log('📱 Push notification WebSocket server created at /ws/notifications');

      this.wss.on('connection', (ws, req) => {
        console.log('📱 WebSocket client connected for push notifications from:', req.socket.remoteAddress);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'auth' && data.userId) {
            this.clients.set(data.userId, {
              ws,
              userId: data.userId,
              userType: data.userType || 'user'
            });

            console.log(`🔐 User ${data.userId} authenticated for push notifications`);

            // Send confirmation
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Connected to push notifications'
            }));
          }
        } catch (error) {
          console.error('Error parsing push notification WebSocket message:', error);
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`🚪 Push notification WebSocket closed: ${code} ${reason?.toString() || ''}`);
        // Remove client from connected clients
        for (const [userId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            this.clients.delete(userId);
            console.log(`🚪 User ${userId} disconnected from push notifications`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        // Enhanced error logging to avoid [object Object] errors
        const getErrorInfo = (err: any) => {
          try {
            if (err instanceof Error) {
              return {
                message: err.message || 'No message',
                name: err.name || 'Unknown Error',
                stack: err.stack || 'No stack trace',
                type: err.constructor?.name || 'Error'
              };
            } else if (typeof err === 'object' && err !== null) {
              return {
                message: err.message || err.toString() || 'Object error',
                type: err.constructor?.name || 'Object',
                stringified: JSON.stringify(err, null, 2)
              };
            } else {
              return {
                message: String(err),
                type: typeof err,
                raw: err
              };
            }
          } catch (stringifyError) {
            return {
              message: 'Error serialization failed',
              type: 'SerializationError',
              originalError: String(err)
            };
          }
        };

        const errorInfo = getErrorInfo(error);
        console.error('🔴 Push notification WebSocket error:', errorInfo);

        // Remove client on error
        for (const [userId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            this.clients.delete(userId);
            console.log(`❌ User ${userId} removed due to WebSocket error: ${errorInfo.message}`);
            break;
          }
        }
      });
    });
    } catch (error) {
      console.error('❌ Failed to initialize push notification WebSocket server:', error);
      throw error;
    }
  }

  async sendPushNotification(
    userIds: string[], 
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const db = getDatabase();
    const notificationId = new Date().getTime().toString();

    for (const userId of userIds) {
      try {
        // Store notification in database
        const notification: PushNotification = {
          id: notificationId + '_' + userId,
          title,
          message,
          userId,
          type,
          timestamp: new Date(),
          read: false
        };

        await db.collection('userNotifications').insertOne(notification);

        // Send real-time notification if user is connected
        const client = this.clients.get(userId);
        if (client && client.ws.readyState === 1) { // WebSocket.OPEN
          client.ws.send(JSON.stringify({
            type: 'push_notification',
            data: {
              id: notification.id,
              title,
              message,
              type,
              timestamp: notification.timestamp
            }
          }));
          
          console.log(`📱 Push notification sent to user ${userId}: ${title}`);
          sent++;
        } else {
          console.log(`📵 User ${userId} not connected, notification stored for later`);
          // Still count as sent since it's stored in database
          sent++;
        }
      } catch (error) {
        console.error(`Failed to send push notification to user ${userId}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  async sendToAllUsers(
    title: string,
    message: string,
    userType?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<{ sent: number; failed: number }> {
    try {
      const db = getDatabase();

      // Get all users or filtered by type
      const query = userType && userType !== 'all' ? { userType } : {};
      const users = await db.collection('users').find(query).toArray();

      const userIds = users.map(user => user._id.toString());

      return await this.sendPushNotification(userIds, title, message, type);
    } catch (error) {
      console.error('Error sending notification to all users:', error);
      return { sent: 0, failed: 1 };
    }
  }

  // Bulk notification sender for admin use
  async sendBulkNotifications(
    userIds: string[],
    notification: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      timestamp: Date;
    }
  ): Promise<{ sent: number; failed: number }> {
    return await this.sendPushNotification(
      userIds,
      notification.title,
      notification.message,
      notification.type
    );
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const db = getDatabase();
      
      const result = await db.collection('userNotifications').updateOne(
        { id: notificationId, userId },
        { $set: { read: true } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<PushNotification[]> {
    try {
      const db = getDatabase();
      
      const notifications = await db
        .collection('userNotifications')
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.clients.has(userId);
  }
}

export const pushNotificationService = new PushNotificationService();
