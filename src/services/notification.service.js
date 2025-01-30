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
import { SoundManager } from '../utils/soundManager';

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
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      // Get user's preferred notification sound
      const preferredSound = userDoc.data()?.settings?.notificationSound || 'NOTIFICATION_1';

      // Add notification to user's notifications collection
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      await addDoc(notificationsRef, {
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      });

      // Update user's unread notification count
      const currentCount = userDoc.data()?.unreadNotifications || 0;
      await updateDoc(userRef, {
        unreadNotifications: currentCount + 1
      });

      // Play the user's preferred notification sound
      await SoundManager.playNotification(preferredSound);

      return true;
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
    try {
      // Create audio context only when needed
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set notification sound properties
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      // Play sound
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1); // Stop after 100ms
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
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

  static async getUserNotifications(userId) {
    try {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const q = query(notificationsRef, where('read', '==', false));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }
}

export const subscribeToNotifications = NotificationService.subscribeToNotifications.bind(NotificationService);