import { 
  collection, 
  query, 
  getDocs,
  doc,
  updateDoc,
  addDoc,
  orderBy,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';

export class NotificationService {
  static async getUserNotifications(userId) {
    try {
      const notificationsRef = collection(db, `users/${userId}/notifications`);
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  static async markAsRead(userId, notificationId) {
    try {
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });

      // Update unread count
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        unreadNotifications: increment(-1)
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static subscribeToUserNotifications(userId, callback) {
    const userNotificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(userNotificationsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  }

  static async createNotification(userId, notification) {
    try {
      const userNotificationsRef = collection(db, `users/${userId}/notifications`);
      await addDoc(userNotificationsRef, {
        ...notification,
        createdAt: new Date().toISOString(),
        read: false
      });

      // Update unread count
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        unreadNotifications: increment(1)
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}