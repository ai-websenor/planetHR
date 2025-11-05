import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socket IDs
  private organizationRooms = new Map<string, Set<string>>(); // organizationId -> Set of socket IDs

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const organizationId = payload.organizationId;
      const role = payload.role;

      // Store user-socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join organization room
      client.join(`org:${organizationId}`);
      client.join(`role:${organizationId}:${role}`);

      // Store organization-socket mapping
      if (!this.organizationRooms.has(organizationId)) {
        this.organizationRooms.set(organizationId, new Set());
      }
      this.organizationRooms.get(organizationId)!.add(client.id);

      // Store user info in socket
      client.data = { userId, organizationId, role };

      this.logger.log(`User ${userId} connected via socket ${client.id}`);

    } catch (error) {
      this.logger.error('Authentication failed for socket connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const { userId, organizationId } = client.data || {};

    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    if (organizationId && this.organizationRooms.has(organizationId)) {
      this.organizationRooms.get(organizationId)!.delete(client.id);
      if (this.organizationRooms.get(organizationId)!.size === 0) {
        this.organizationRooms.delete(organizationId);
      }
    }

    this.logger.log(`Socket ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe-employee-updates')
  handleSubscribeEmployeeUpdates(
    @MessageBody() data: { employeeId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.join(`employee:${data.employeeId}`);
    this.logger.log(`Socket ${client.id} subscribed to employee ${data.employeeId} updates`);
  }

  @SubscribeMessage('unsubscribe-employee-updates')
  handleUnsubscribeEmployeeUpdates(
    @MessageBody() data: { employeeId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.leave(`employee:${data.employeeId}`);
    this.logger.log(`Socket ${client.id} unsubscribed from employee ${data.employeeId} updates`);
  }

  // Public methods for sending notifications

  sendToUser(userId: string, notification: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.server.to(socketId).emit('notification', notification);
      });
      this.logger.log(`Sent notification to user ${userId}`);
    }
  }

  sendToOrganization(organizationId: string, notification: any) {
    this.server.to(`org:${organizationId}`).emit('notification', notification);
    this.logger.log(`Sent notification to organization ${organizationId}`);
  }

  sendToRole(organizationId: string, role: string, notification: any) {
    this.server.to(`role:${organizationId}:${role}`).emit('notification', notification);
    this.logger.log(`Sent notification to role ${role} in organization ${organizationId}`);
  }

  sendEmployeeUpdate(employeeId: string, update: any) {
    this.server.to(`employee:${employeeId}`).emit('employee-update', update);
    this.logger.log(`Sent employee update for ${employeeId}`);
  }

  // Real-time progress updates for employee processing
  sendProcessingUpdate(employeeId: string, update: {
    stage: string;
    progress: number;
    message: string;
    estimatedTimeRemaining?: string;
  }) {
    this.server.to(`employee:${employeeId}`).emit('processing-update', {
      employeeId,
      ...update,
      timestamp: new Date().toISOString(),
    });
  }

  // Send report completion notification
  sendReportComplete(employeeId: string, reportInfo: {
    reportType: string;
    viewerRole: string;
    isComplete: boolean;
    totalCompleted: number;
    totalExpected: number;
  }) {
    this.server.to(`employee:${employeeId}`).emit('report-complete', {
      employeeId,
      ...reportInfo,
      timestamp: new Date().toISOString(),
    });
  }
}