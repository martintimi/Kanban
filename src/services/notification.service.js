import { getToken, onMessage } from 'firebase/messaging';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  addDoc,
  orderBy,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { ProjectService } from '../components/Projects/project.service';
import { db, messaging } from '../firebase/config';

export class NotificationService {
  static async subscribeToNotifications(userId, callback) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging);
        
        await this.saveUserToken(userId, token);

        // Return an unsubscribe function
        const unsubscribe = onMessage(messaging, (payload) => {
          callback(payload);
        });

        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      }
      // Return a no-op function if permission not granted
      return () => {};
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      // Return a no-op function on error
      return () => {};
    }
  }

  static async sendTaskNotification(userId, notification) {
    try {
      // Add notification to user's notifications collection
      const userNotificationsRef = collection(db, 'users', userId, 'notifications');
      await addDoc(userNotificationsRef, {
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      });
      
      // Remove audio play from here since it should be handled on recipient's side
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  static async saveUserToken(userId, token) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationToken: token
      });
    } catch (error) {
      console.error('Error saving user token:', error);
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
      const userDoc = await getDoc(userRef);
      const currentCount = userDoc.data()?.unreadNotifications || 0;
      if (currentCount > 0) {
        await updateDoc(userRef, {
          unreadNotifications: currentCount - 1
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static playNotificationSound() {
    const audio = new Audio('/notification.mp3');
    return audio.play().catch(e => console.log('Audio play failed:', e));
  }

  static subscribeToUserNotifications(userId, callback) {
    const userNotificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(userNotificationsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      // Play sound when new notifications arrive
      const changes = snapshot.docChanges();
      const hasNewNotification = changes.some(change => change.type === 'added' && 
        // Only play for truly new notifications (not just initial load)
        new Date(change.doc.data().createdAt).getTime() > Date.now() - 1000);
      
      if (hasNewNotification) {
        this.playNotificationSound();
      }

      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  }
}

export const subscribeToNotifications = NotificationService.subscribeToNotifications.bind(NotificationService);