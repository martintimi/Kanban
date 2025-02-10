import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';

export class OrganizationService {
  static async createOrganization(data) {
    try {
      const orgsRef = collection(db, 'organizations');
      const newOrg = {
        ...data,
        createdAt: new Date().toISOString(),
        members: [data.createdBy], // Creator is first member
        pendingInvites: []
      };
      const docRef = await addDoc(orgsRef, newOrg);
      return { id: docRef.id, ...newOrg };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  static async inviteUser(orgId, email) {
    try {
      const orgRef = doc(db, 'organizations', orgId);
      await updateDoc(orgRef, {
        pendingInvites: arrayUnion(email)
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }

  static async acceptInvite(orgId, userId) {
    try {
      const orgRef = doc(db, 'organizations', orgId);
      await updateDoc(orgRef, {
        members: arrayUnion(userId),
        pendingInvites: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  }

  static async getUserOrganizations(userId) {
    try {
      const orgsRef = collection(db, 'organizations');
      const q = query(orgsRef, where('members', 'array-contains', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user organizations:', error);
      throw error;
    }
  }

  static async getOrganizationMembers(orgId) {
    try {
      const orgRef = doc(db, 'organizations', orgId);
      const orgDoc = await getDoc(orgRef);
      
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      const org = orgDoc.data();
      const memberIds = org.members || [];

      // Get user details for each member
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', 'in', memberIds));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting organization members:', error);
      throw error;
    }
  }
} 