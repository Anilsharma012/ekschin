import { WebSocketServer } from 'ws';
import { getDatabase } from '../db/mongodb';

interface ConnectedClient {
  ws: any;
  userId: string;
  userType: string;
}

class PackageSyncService {
  private clients: Map<string, ConnectedClient> = new Map();
  private wss: WebSocketServer | null = null;

  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/packages'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('📦 Package sync client connected');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'auth' && data.userId) {
            this.clients.set(data.userId, {
              ws,
              userId: data.userId,
              userType: data.userType || 'user'
            });
            
            console.log(`🔐 User ${data.userId} authenticated for package sync`);
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'sync_complete',
              message: 'Connected to package sync'
            }));
          }
        } catch (error) {
          console.error('Error parsing package sync message:', error);
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`🚪 Package sync WebSocket closed: ${code} ${reason?.toString() || ''}`);
        // Remove client from connected clients
        for (const [userId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            this.clients.delete(userId);
            console.log(`🚪 User ${userId} disconnected from package sync`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('🔴 Package sync WebSocket error:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        });

        // Remove client on error
        for (const [userId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            this.clients.delete(userId);
            console.log(`❌ User ${userId} removed due to package sync WebSocket error`);
            break;
          }
        }
      });
    });
  }

  // Broadcast package creation to all connected clients
  async broadcastPackageCreated(packageData: any) {
    const message = {
      type: 'package_created',
      package: packageData,
      timestamp: new Date()
    };

    this.broadcastToAll(message);
    console.log('📦 Broadcasted package creation:', packageData.name);
  }

  // Broadcast package update to all connected clients
  async broadcastPackageUpdated(packageData: any) {
    const message = {
      type: 'package_updated',
      package: packageData,
      timestamp: new Date()
    };

    this.broadcastToAll(message);
    console.log('📦 Broadcasted package update:', packageData.name);
  }

  // Broadcast package deletion to all connected clients
  async broadcastPackageDeleted(packageId: string) {
    const message = {
      type: 'package_deleted',
      packageId,
      timestamp: new Date()
    };

    this.broadcastToAll(message);
    console.log('📦 Broadcasted package deletion:', packageId);
  }

  // Broadcast user package creation to specific user
  async broadcastUserPackageCreated(userPackageData: any) {
    const message = {
      type: 'user_package_created',
      userPackage: userPackageData,
      timestamp: new Date()
    };

    // Send to specific user
    this.sendToUser(userPackageData.userId, message);
    console.log('🎯 Broadcasted user package creation to user:', userPackageData.userId);
  }

  // Broadcast user package update to specific user
  async broadcastUserPackageUpdated(userPackageData: any) {
    const message = {
      type: 'user_package_updated',
      userPackage: userPackageData,
      timestamp: new Date()
    };

    // Send to specific user
    this.sendToUser(userPackageData.userId, message);
    console.log('🎯 Broadcasted user package update to user:', userPackageData.userId);
  }

  // Send message to all connected clients
  private broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    for (const [userId, client] of this.clients.entries()) {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        try {
          client.ws.send(messageStr);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send package sync to user ${userId}:`, error);
          // Remove disconnected client
          this.clients.delete(userId);
        }
      }
    }

    console.log(`📡 Package sync message sent to ${sentCount} clients`);
  }

  // Send message to specific user
  private sendToUser(userId: string, message: any) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN
      try {
        client.ws.send(JSON.stringify(message));
        console.log(`📤 Package sync message sent to user ${userId}`);
      } catch (error) {
        console.error(`Failed to send package sync to user ${userId}:`, error);
        this.clients.delete(userId);
      }
    } else {
      console.log(`📵 User ${userId} not connected for package sync`);
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.clients.size;
  }

  // Get connected users
  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.clients.has(userId);
  }
}

export const packageSyncService = new PackageSyncService();
