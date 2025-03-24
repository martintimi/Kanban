import { db } from '../firebase/config';

export class NotificationService {
  // Add method to send notifications to admin users
  static async sendNotificationToAdmins(notification) {
    try {
      // Get all users with admin role
      const adminUsersSnapshot = await db.collection('users')
        .where('role', '==', 'admin')
        .get();
        
      if (adminUsersSnapshot.empty) {
        console.log('No admin users found to notify');
        return [];
      }
      
      // Create notifications for each admin
      const batch = db.batch();
      const notifications = [];
      
      adminUsersSnapshot.forEach(doc => {
        const adminId = doc.id;
        const adminNotification = {
          ...notification,
          recipientId: adminId,
          read: false,
          createdAt: new Date().toISOString()
        };
        
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, adminNotification);
        
        notifications.push({
          id: notificationRef.id,
          ...adminNotification
        });
      });
      
      // Commit the batch
      await batch.commit();
      console.log(`Sent notifications to ${notifications.length} admins`);
      
      return notifications;
    } catch (error) {
      console.error('Error sending notifications to admins:', error);
      throw error;
    }
  }

  // Add method to send direct notification to a specific user
  static async sendDirectNotification(notification) {
    if (!notification.recipientId) {
      console.error('Missing recipient ID for direct notification');
      throw new Error('Missing recipient ID');
    }
    
    try {
      // Create the notification document with required fields
      const notificationData = {
        ...notification,
        read: false,
        createdAt: notification.createdAt || new Date().toISOString()
      };
      
      // Add to the notifications collection
      const notificationRef = db.collection('notifications').doc();
      await notificationRef.set(notificationData);
      
      console.log(`Sent direct notification to user: ${notification.recipientId}`);
      
      return {
        id: notificationRef.id,
        ...notificationData
      };
    } catch (error) {
      console.error('Error sending direct notification:', error);
      throw error;
    }
  }
} 