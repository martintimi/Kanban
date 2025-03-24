const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
admin.initializeApp();

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

exports.sendEmail = functions.https.onCall(async (data, context) => {
  try {
    const { to, subject, html, attachments } = data;
    
    if (!to || !subject || !html) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required email parameters');
    }
    
    if (!isValidEmail(to)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
    }

    const mailOptions = {
      from: functions.config().email.user,
      to,
      subject,
      html,
      attachments
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Error sending email: ' + error.message);
  }
});

// Cloud function to send meeting invitations
exports.sendMeetingInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in');
  }

  const { meetingId, email, meetingTitle, organizationId } = data;

  if (!meetingId || !email || !organizationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  if (!isValidEmail(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
  }

  try {
    // Get organization details
    const orgDoc = await admin.firestore().collection('organizations').doc(organizationId).get();
    
    if (!orgDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Organization not found');
    }
    
    const organization = orgDoc.data();
    
    // Check if user has permission to invite to this organization
    const isMember = organization.members && organization.members.includes(context.auth.uid);
    const isAdmin = organization.admins && organization.admins.includes(context.auth.uid);
    
    if (!isMember && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to invite users to this organization');
    }

    // Get meeting details
    const meetingDoc = await admin.firestore().collection('meetings').doc(meetingId).get();
    
    if (!meetingDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Meeting not found');
    }

    // Get sender details
    const senderDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const sender = senderDoc.data();

    // Check for existing invitation
    const existingInvites = await admin.firestore()
      .collection('meetingInvitations')
      .where('meetingId', '==', meetingId)
      .where('inviteeEmail', '==', email.toLowerCase())
      .where('status', '==', 'pending')
      .get();

    if (!existingInvites.empty) {
      throw new functions.https.HttpsError('already-exists', 'An invitation has already been sent to this email');
    }

    // Create meeting invitation
    const inviteRef = await admin.firestore().collection('meetingInvitations').add({
      meetingId,
      organizationId,
      inviteeEmail: email.toLowerCase(),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
    });

    // Generate meeting link
    const meetingLink = `${functions.config().app.url}/meetings/${meetingId}`;

    // Send email
    const mailOptions = {
      from: functions.config().email.user,
      to: email,
      subject: `Invitation to join a meeting in ${organization.name}`,
      html: `
        <h2>Meeting Invitation</h2>
        <p>Hello,</p>
        <p>${sender.displayName || sender.email} has invited you to join a meeting in ${organization.name}.</p>
        <p><strong>Meeting:</strong> ${meetingTitle}</p>
        <p><strong>Organization:</strong> ${organization.name}</p>
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
        <p style="color: #666; font-size: 12px;">This invitation will expire in 24 hours.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      invitationId: inviteRef.id
    };
  } catch (error) {
    console.error('Error sending meeting invitation:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud function to send organization invitations
exports.sendOrganizationInvitation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in');
  }

  const { email, organizationId, organizationName, role, inviterId } = data;

  if (!email || !organizationId || !organizationName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  if (!isValidEmail(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
  }

  try {
    // Check if organization exists
    const orgDoc = await admin.firestore().collection('organizations').doc(organizationId).get();
    
    if (!orgDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Organization not found');
    }
    
    const organization = orgDoc.data();
    
    // Check if user has permission to invite to this organization
    const isAdmin = organization.admins && organization.admins.includes(context.auth.uid);
    
    if (!isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to invite users to this organization');
    }
    
    // Check if the invitation already exists
    const existingInvites = await admin.firestore()
      .collection('invitations')
      .where('inviteeEmail', '==', email.toLowerCase())
      .where('organizationId', '==', organizationId)
      .where('status', '==', 'pending')
      .get();

    if (!existingInvites.empty) {
      throw new functions.https.HttpsError('already-exists', 'An invitation has already been sent to this email.');
    }

    // Create the invitation
    const inviteRef = await admin.firestore().collection('invitations').add({
      organizationId,
      organizationName,
      inviteeEmail: email.toLowerCase(),
      role,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: inviterId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    });
    
    // Generate organization invite link
    const inviteLink = `${functions.config().app.url}/invite/${inviteRef.id}`;
    
    // Get sender details
    const senderDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const sender = senderDoc.data();
    
    // Send email
    const mailOptions = {
      from: functions.config().email.user,
      to: email,
      subject: `Invitation to join ${organizationName}`,
      html: `
        <h2>Organization Invitation</h2>
        <p>Hello,</p>
        <p>${sender.displayName || sender.email} has invited you to join ${organizationName} as a ${role || 'member'}.</p>
        <p>Click the button below to join the organization:</p>
        <div style="margin: 20px 0;">
          <a href="${inviteLink}" style="
            background-color: #1976d2;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
          ">
            Join Organization
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">This invitation will expire in 7 days.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);

    return { 
      success: true,
      invitationId: inviteRef.id
    };
  } catch (error) {
    console.error('Error sending organization invitation:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.respondToInvitation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in');
  }

  const { invitationId, response } = data;

  if (!invitationId || !response) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    const invitationRef = admin.firestore().collection('invitations').doc(invitationId);
    const invitationDoc = await invitationRef.get();

    if (!invitationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invitation not found');
    }
    
    const invitation = invitationDoc.data();
    
    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
      await invitationRef.update({ status: 'expired' });
      throw new functions.https.HttpsError('failed-precondition', 'This invitation has expired');
    }
    
    // Check if the invitation is meant for this user
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    
    if (!user || user.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
      throw new functions.https.HttpsError('permission-denied', 'This invitation is not meant for you');
    }

    if (response === 'accept') {
      // Logic to add user to organization
      await admin.firestore().collection('organizations').doc(invitation.organizationId).update({
        members: admin.firestore.FieldValue.arrayUnion(context.auth.uid)
      });
      
      // If a role was specified, assign it
      if (invitation.role === 'admin') {
        await admin.firestore().collection('organizations').doc(invitation.organizationId).update({
          admins: admin.firestore.FieldValue.arrayUnion(context.auth.uid)
        });
      }
      
      await invitationRef.update({ status: 'accepted' });
    } else if (response === 'decline') {
      await invitationRef.update({ status: 'declined' });
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid response value. Must be "accept" or "decline"');
    }

    return { success: true };
  } catch (error) {
    console.error('Error responding to invitation:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Function to clean up expired invitations
exports.cleanupExpiredInvitations = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    // Clean up meeting invitations
    const expiredMeetingInvitesQuery = await admin.firestore()
      .collection('meetingInvitations')
      .where('status', '==', 'pending')
      .where('expiresAt', '<=', now)
      .get();

    // Clean up organization invitations
    const expiredOrgInvitesQuery = await admin.firestore()
      .collection('invitations')
      .where('status', '==', 'pending')
      .where('expiresAt', '<=', now)
      .get();
    
    const batch = admin.firestore().batch();
    
    expiredMeetingInvitesQuery.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'expired' });
    });
    
    expiredOrgInvitesQuery.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'expired' });
    });

    await batch.commit();
    
    return { 
      success: true, 
      processed: {
        meetingInvitations: expiredMeetingInvitesQuery.size,
        organizationInvitations: expiredOrgInvitesQuery.size
      }
    };
  } catch (error) {
    console.error('Error cleaning up expired invitations:', error);
    return { error: error.message };
  }
});

// Function to notify users about new tasks
exports.notifyNewTask = functions.firestore
  .document('tasks/{taskId}')
  .onCreate(async (snapshot, context) => {
    try {
      const taskData = snapshot.data();
      const { assignedTo, boardId, title, createdBy } = taskData;
      
      if (!assignedTo) return null;
      
      // Get the board
      const boardDoc = await admin.firestore().collection('boards').doc(boardId).get();
      if (!boardDoc.exists) return null;
      const board = boardDoc.data();
      
      // Get the creator info
      const creatorDoc = await admin.firestore().collection('users').doc(createdBy).get();
      const creator = creatorDoc.data();
      
      // Get the assigned user info
      const assigneeDoc = await admin.firestore().collection('users').doc(assignedTo).get();
      if (!assigneeDoc.exists) return null;
      const assignee = assigneeDoc.data();
      
      // Only send email if user has email notifications enabled
      if (!assignee.emailNotifications) return null;
      
      const mailOptions = {
        from: functions.config().email.user,
        to: assignee.email,
        subject: `New Task Assigned: ${title}`,
        html: `
          <h2>New Task Assignment</h2>
          <p>Hello ${assignee.displayName || assignee.email},</p>
          <p>${creator.displayName || creator.email} has assigned you a new task on the board "${board.name}".</p>
          <p><strong>Task:</strong> ${title}</p>
          <p>Click the button below to view the task:</p>
          <div style="margin: 20px 0;">
            <a href="${functions.config().app.url}/boards/${boardId}" style="
              background-color: #1976d2;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              display: inline-block;
            ">
              View Task
            </a>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending task notification:', error);
      return { error: error.message };
    }
  }); 