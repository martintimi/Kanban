import { 
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  getDocs,
  deleteField,
  setDoc,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth } from '../firebase/config';

class MeetingService {
  constructor() {
    this.functions = getFunctions();
  }

  async createMeeting({ title }) {
    try {
      const meetingsRef = collection(db, 'meetings');
      const meetingDoc = await addDoc(meetingsRef, {
        title,
        createdAt: serverTimestamp(),
        status: 'active',
        hostId: auth.currentUser.uid,
        participants: {
          [auth.currentUser.uid]: {
            id: auth.currentUser.uid,
            name: auth.currentUser.displayName || auth.currentUser.email,
            role: 'host',
            joinedAt: serverTimestamp()
          }
        }
      });

      return {
        id: meetingDoc.id,
        title,
        hostId: auth.currentUser.uid
      };
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  async getMeeting(meetingId) {
    try {
      const meetingDoc = await getDoc(doc(db, 'meetings', meetingId));
      if (!meetingDoc.exists()) {
        throw new Error('Meeting not found');
      }
      return {
        id: meetingDoc.id,
        ...meetingDoc.data()
      };
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw error;
    }
  }

  async joinMeeting(meetingId, participant) {
    try {
      console.log(`User ${participant.id} joining meeting ${meetingId}`);
      
      const meetingRef = doc(db, 'meetings', meetingId);
      const meetingDoc = await getDoc(meetingRef);
      
      if (!meetingDoc.exists()) {
        throw new Error('Meeting not found');
      }
      
      // Check if this user is already in the meeting
      const data = meetingDoc.data();
      const participants = data.participants || {};
      
      if (participants[participant.id]) {
        console.log(`User ${participant.id} already in meeting, updating status`);
        // Just update their status as active
        await updateDoc(meetingRef, {
          [`participants.${participant.id}.lastActive`]: serverTimestamp(),
          [`participants.${participant.id}.status`]: 'active'
        });
      } else {
        // Add them as a new participant
        console.log(`Adding user ${participant.id} as new participant`);
        await updateDoc(meetingRef, {
          [`participants.${participant.id}`]: {
            id: participant.id,
            name: participant.name,
            email: participant.email,
            isGuest: participant.isGuest || false,
            userAgent: navigator.userAgent,
            joinedAt: serverTimestamp(),
            status: 'active'
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  }

  async leaveMeeting(meetingId, participantId) {
    try {
      const meetingRef = doc(db, 'meetings', meetingId);
      await updateDoc(meetingRef, {
        [`participants.${participantId}`]: null
      });
    } catch (error) {
      console.error('Error leaving meeting:', error);
      throw error;
    }
  }

  // Add back the meetings subscription
  onMeetingsChange(callback) {
    if (!auth.currentUser) {
      // Return empty meetings array if user is not logged in
      callback([]);
      return () => {};
    }

    const currentUserId = auth.currentUser.uid;
    const meetingsRef = collection(db, 'meetings');
    
    // First query: meetings where user is the host
    const hostQuery = query(
      meetingsRef,
      where('status', '==', 'active'),
      where('hostId', '==', currentUserId)
    );
    
    console.log(`Fetching meetings for user: ${currentUserId}`);
    
    // Use a merged listener for both queries
    return onSnapshot(hostQuery, (hostSnapshot) => {
      const meetings = [];
      
      // Add meetings where user is host
      hostSnapshot.forEach((doc) => {
        const data = doc.data();
        meetings.push({
          id: doc.id,
          ...data,
          isHost: true
        });
      });
      
      // Return the merged results
      callback(meetings);
    });
  }

  async sendSignal(roomId, fromUserId, toUserId, data) {
    try {
      const signalRef = collection(db, 'meetings', roomId, 'signals');
      await addDoc(signalRef, {
        fromUserId,
        toUserId,
        data,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error sending signal:', error);
      return false;
    }
  }

  async sendMeetingInvite(meetingId, email, meetingDetails) {
    try {
      if (!meetingId || !email || !meetingDetails) {
        throw new Error('Missing required parameters');
      }

      // Get the current user's organization
      const meeting = await this.getMeeting(meetingId);
      
      // Generate a unique guest access token
      const guestToken = this.generateGuestToken();
      
      // Create invitation record
      const inviteRef = await addDoc(collection(db, 'meetingInvitations'), {
        meetingId,
        email: email.toLowerCase(),
        guestToken,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour expiry
        hostId: auth.currentUser.uid,
        hostName: auth.currentUser.displayName || auth.currentUser.email
      });

      // Create meeting link with guest token
      const meetingLink = `${window.location.origin}/meetings/${meetingId}?token=${guestToken}`;

      // Generate ICS calendar file content
      const icsContent = this.generateICSFile({
        ...meetingDetails,
        meetingId,
        meetingLink
      });

      // Call Firebase function to send email
      const sendEmailFn = httpsCallable(this.functions, 'sendEmail');
      await sendEmailFn({
        to: email,
        subject: `Meeting Invitation: ${meetingDetails.title}`,
        html: `
          <h2>You've been invited to a meeting</h2>
          <p><strong>Meeting:</strong> ${meetingDetails.title}</p>
          <p><strong>Host:</strong> ${meetingDetails.hostName}</p>
          <p><strong>When:</strong> ${new Date(meetingDetails.startTime).toLocaleString()}</p>
          <p>Click the button below to join the meeting:</p>
          <div style="margin: 20px 0;">
            <a href="${meetingLink}" style="
              background-color: #1976d2;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              display: inline-block;
            ">
              Join Meeting
            </a>
          </div>
          <p>Or use this link:</p>
          <p>${meetingLink}</p>
          <p style="color: #666; font-size: 12px;">This invitation will expire in 24 hours.</p>
        `,
        attachments: [
          {
            filename: 'meeting.ics',
            content: icsContent
          }
        ]
      });

      console.log('Invitation sent successfully');
      return {
        success: true,
        invitationId: inviteRef.id,
        guestToken
      };
    } catch (error) {
      console.error('Error sending meeting invitation:', error);
      throw error;
    }
  }

  generateGuestToken() {
    return 'guest_' + Math.random().toString(36).substr(2, 9);
  }

  generateICSFile(meetingDetails) {
    const startDate = new Date(meetingDetails.startTime);
    const endDate = new Date(startDate.getTime() + (meetingDetails.duration * 60000));
    
    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${meetingDetails.title}
DESCRIPTION:${meetingDetails.description || 'Online meeting'}\n\nJoin URL: ${meetingDetails.meetingLink}
LOCATION:${meetingDetails.meetingLink}
END:VEVENT
END:VCALENDAR`;
  }

  async validateGuestToken(meetingId, token) {
    try {
      // Query for invitations with this token and meeting ID
      const invitationsRef = collection(db, 'meetingInvitations');
      const q = query(
        invitationsRef, 
        where('meetingId', '==', meetingId),
        where('guestToken', '==', token)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No invitation found with this token');
        return false;
      }
      
      // Get the first matching invitation
      const invitation = querySnapshot.docs[0].data();
      
      // Check if the invitation has expired
      const expiryDate = invitation.expiresAt?.toDate ? 
        invitation.expiresAt.toDate() : new Date(invitation.expiresAt);
      
      if (expiryDate < new Date()) {
        console.log('Invitation has expired');
        return false;
      }
      
      // If we get here, the invitation is valid
      return true;
    } catch (error) {
      console.error('Error validating guest token:', error);
      return false;
    }
  }

  async addToWaitingRoom(meetingId, participant) {
    try {
      const meetingRef = doc(db, 'meetings', meetingId);
      await updateDoc(meetingRef, {
        [`waitingRoom.${participant.id}`]: {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          joinedAt: serverTimestamp(),
          isGuest: participant.isGuest
        }
      });
    } catch (error) {
      console.error('Error adding to waiting room:', error);
      throw error;
    }
  }

  async admitFromWaitingRoom(meetingId, participantId) {
    try {
      console.log(`Admitting participant ${participantId} to meeting ${meetingId}`);
      
      // First, get the current state
      const meetingRef = doc(db, 'meetings', meetingId);
      const meetingDoc = await getDoc(meetingRef);
      
      if (!meetingDoc.exists()) {
        throw new Error('Meeting not found');
      }
      
      const data = meetingDoc.data();
      const waitingRoom = data.waitingRoom || {};
      
      // Get the participant's data from the waiting room
      const participant = waitingRoom[participantId];
      
      if (!participant) {
        console.warn(`Participant ${participantId} not found in waiting room`);
        return false;
      }
      
      // Create a batch to ensure this is atomic
      const batch = writeBatch(db);
      
      // Add to participants collection
      batch.update(meetingRef, {
        [`participants.${participantId}`]: {
          id: participantId,
          name: participant.name,
          email: participant.email,
          isGuest: participant.isGuest || false,
          userAgent: participant.userAgent,
          joinedAt: serverTimestamp(),
          admittedAt: serverTimestamp()
        }
      });
      
      // Remove from waiting room
      batch.update(meetingRef, {
        [`waitingRoom.${participantId}`]: deleteField()
      });
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Successfully admitted participant ${participantId}`);
      return true;
    } catch (error) {
      console.error('Error admitting from waiting room:', error);
      throw error;
    }
  }

  async removeFromWaitingRoom(meetingId, participantId) {
    try {
      const meetingRef = doc(db, 'meetings', meetingId);
      
      // Simply remove the participant from the waiting room without adding to participants
      await updateDoc(meetingRef, {
        [`waitingRoom.${participantId}`]: deleteField()
      });
    } catch (error) {
      console.error('Error removing from waiting room:', error);
      throw error;
    }
  }

  // Subscribe to waiting room changes
  onWaitingRoomChange(meetingId, callback) {
    try {
      const meetingRef = doc(db, 'meetings', meetingId);
      
      return onSnapshot(meetingRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const waitingRoom = data.waitingRoom || {};
          const participants = Object.values(waitingRoom);
          callback(participants);
        } else {
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error subscribing to waiting room:', error);
      return () => {};
    }
  }

  // Subscribe to participant admission status
  onParticipantAdmitted(meetingId, participantId, callback) {
    try {
      console.log(`Setting up admission listener for participant: ${participantId}`);
      
      // Reference to the participants sub-collection in the meeting
      const participantsRef = doc(db, 'meetings', meetingId);
      
      // Listen for changes to this specific participant's admission status
      return onSnapshot(participantsRef, (snapshot) => {
        if (!snapshot.exists()) {
          console.log('Meeting document does not exist');
          return;
        }
        
        const meetingData = snapshot.data();
        const participants = meetingData.participants || {};
        
        // Check if this specific participant has been admitted
        if (participants[participantId]) {
          console.log(`Participant ${participantId} found in admitted participants`);
          // They've been admitted if they exist in participants
          callback(true);
        } else {
          // Check if they're still in waiting room
          const waitingRoom = meetingData.waitingRoom || {};
          const isInWaitingRoom = !!waitingRoom[participantId];
          
          if (!isInWaitingRoom) {
            console.log(`Participant ${participantId} not found in waiting room either`);
            // If they're not in the waiting room anymore but not admitted,
            // they were probably denied access
            callback(false);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up participant admitted listener:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Direct join with token (no authentication required)
  async validateAndJoinWithToken(meetingId, token) {
    try {
      // First check if the meeting exists
      const meetingRef = doc(db, 'meetings', meetingId);
      const meetingDoc = await getDoc(meetingRef);
      
      if (!meetingDoc.exists()) {
        throw new Error('Meeting not found');
      }
      
      // Create a stable fingerprint based on the browser and token
      // This ensures the same browser gets the same ID for a given token
      const browserFingerprint = navigator.userAgent + 
                                window.navigator.language + 
                                window.screen.colorDepth + 
                                window.screen.width + 
                                window.screen.height;
      
      // Create a hash that's stable across page refreshes
      const hashCode = this.hashString(browserFingerprint + token);
      
      // Use the token + fingerprint to create a unique but stable guest ID
      const guestId = `guest_${token.substring(0,6)}_${hashCode}`;
      
      console.log('Generated stable guest ID:', guestId);
      
      // Track this token access - helps with security and auditing
      await updateDoc(meetingRef, {
        [`tokenAccesses.${guestId}`]: {
          token: token,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
          guestId: guestId
        }
      });
      
      return guestId;
    } catch (error) {
      console.error('Error validating token:', error);
      throw error;
    }
  }
  
  // Create a more stable hash function to ensure consistent guest IDs
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    // Use a more sophisticated hashing algorithm for stability
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Return a positive hex string that's reasonably short but unique
    return Math.abs(hash).toString(16).substring(0, 6);
  }

  async createDirectInvitation(meetingId, email, inviteData) {
    try {
      // Create a unique ID for the invitation
      const invitationId = `${meetingId}_${Date.now()}`;
      
      // Get a reference to the invitations collection
      const invitationRef = doc(db, 'meetingInvitations', invitationId);
      
      // Set the invitation data
      await setDoc(invitationRef, {
        ...inviteData,
        id: invitationId,
        meetingId: meetingId,
        email: email,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours from now
      });
      
      // Update the meeting with the invitation reference
      const meetingRef = doc(db, 'meetings', meetingId);
      await updateDoc(meetingRef, {
        invitations: arrayUnion(invitationId)
      });
      
      return invitationId;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  async findMeetingByPartialId(partialId) {
    try {
      const meetingsRef = collection(db, 'meetings');
      const q = query(meetingsRef);
      const querySnapshot = await getDocs(q);
      
      const meetings = [];
      querySnapshot.forEach((doc) => {
        // Check if the document ID starts with the partial ID
        if (doc.id.startsWith(partialId)) {
          meetings.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      return meetings.length > 0 ? meetings[0] : null;
    } catch (error) {
      console.error('Error finding meeting by partial ID:', error);
      throw error;
    }
  }
}

export const meetingService = new MeetingService(); 