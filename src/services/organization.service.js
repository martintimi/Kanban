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
  where,
  serverTimestamp,
  documentId,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { NotificationService } from './notification.service';

export class OrganizationService {
  static async createOrganization(data) {
    try {
      const orgsRef = collection(db, 'organizations');
      const newOrg = {
        name: data.name,
        createdBy: data.createdBy,
        owner: data.owner,
        roles: data.roles || {},
        createdAt: serverTimestamp(),
        members: [data.createdBy],
        settings: {
          allowInvites: true,
          defaultRole: 'developer'
        }
      };
      
      const docRef = await addDoc(orgsRef, newOrg);
      return { id: docRef.id, ...newOrg };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  static async getUserOrganizations(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

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
      
      const orgData = orgDoc.data();
      const memberIds = orgData.members || [];
      
      // Get all member details
      const usersRef = collection(db, 'users');
      const memberDocs = await Promise.all(
        memberIds.map(id => getDoc(doc(usersRef, id)))
      );
      
      return memberDocs
        .filter(doc => doc.exists())
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          role: orgData.roles[doc.id] || 'developer'
        }));
    } catch (error) {
      console.error('Error getting organization members:', error);
      throw error;
    }
  }

  static async inviteByEmail(organizationId, email, role = 'developer') {
    try {
      if (!organizationId || !email) {
        throw new Error('Organization ID and email are required');
      }

      // Get organization details first
      const orgRef = doc(db, 'organizations', organizationId);
      const orgDoc = await getDoc(orgRef);
      
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }
      
      const orgData = orgDoc.data();

      // Check if user exists
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', email.toLowerCase()));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error('User not found. Please ensure the user has registered.');
      }

      const userData = userSnapshot.docs[0].data();
      const userId = userSnapshot.docs[0].id;

      // Check if user is already a member
      if (orgData.members?.includes(userId)) {
        throw new Error('User is already a member of this organization');
      }

      // Check for existing pending invitations
      const invitationsRef = collection(db, 'invitations');
      const existingInviteQuery = query(
        invitationsRef,
        where('organizationId', '==', organizationId),
        where('inviteeId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const existingInvites = await getDocs(existingInviteQuery);
      
      if (!existingInvites.empty) {
        throw new Error('An invitation has already been sent to this user');
      }

      // Create the invitation
      const invitationData = {
        organizationId,
        organizationName: orgData.name,
        inviteeId: userId,
        inviteeEmail: email.toLowerCase(),
        inviteeName: userData.displayName || userData.email,
        role,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
      };

      const inviteRef = await addDoc(invitationsRef, invitationData);

      // Create notification for the user
      await NotificationService.createNotification(userId, {
        title: `Invitation to join ${orgData.name}`,
        message: `You've been invited to join ${orgData.name} as a ${role}`,
        type: 'INVITATION',
        actionId: inviteRef.id,
        read: false,
        createdAt: new Date().toISOString()
      });

      return {
        success: true,
        invitationId: inviteRef.id,
        message: 'Invitation sent successfully'
      };
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  }

  static async getPendingInvitations(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const invitationsRef = collection(db, 'invitations');
      const q = query(
        invitationsRef,
        where('inviteeId', '==', userId),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      throw error;
    }
  }

  static async acceptInvitation(invitationId, userId) {
    try {
      if (!invitationId || !userId) {
        throw new Error('Invitation ID and User ID are required');
      }

      const inviteRef = doc(db, 'invitations', invitationId);
      const inviteDoc = await getDoc(inviteRef);

      if (!inviteDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const inviteData = inviteDoc.data();

      if (inviteData.status !== 'pending') {
        throw new Error('This invitation is no longer valid');
      }

      if (inviteData.inviteeId !== userId) {
        throw new Error('This invitation was not sent to you');
      }

      const orgRef = doc(db, 'organizations', inviteData.organizationId);
      
      // Update organization members and roles
      await updateDoc(orgRef, {
        members: arrayUnion(userId),
        [`roles.${userId}`]: inviteData.role
      });

      // Update invitation status
      await updateDoc(inviteRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Invitation accepted successfully'
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  static async declineInvitation(invitationId, userId) {
    try {
      if (!invitationId || !userId) {
        throw new Error('Invitation ID and User ID are required');
      }

      const inviteRef = doc(db, 'invitations', invitationId);
      const inviteDoc = await getDoc(inviteRef);

      if (!inviteDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const inviteData = inviteDoc.data();

      if (inviteData.inviteeId !== userId) {
        throw new Error('This invitation was not sent to you');
      }

      await updateDoc(inviteRef, {
        status: 'declined',
        declinedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Invitation declined successfully'
      };
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }

  static async removeMember(organizationId, memberId) {
    try {
      if (!organizationId || !memberId) {
        throw new Error('Organization ID and Member ID are required');
      }

      const orgRef = doc(db, 'organizations', organizationId);
      const orgDoc = await getDoc(orgRef);

      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      const orgData = orgDoc.data();

      if (orgData.owner === memberId) {
        throw new Error('Cannot remove the organization owner');
      }

      await updateDoc(orgRef, {
        members: arrayRemove(memberId),
        [`roles.${memberId}`]: deleteDoc()
      });

      return {
        success: true,
        message: 'Member removed successfully'
      };
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }
} 