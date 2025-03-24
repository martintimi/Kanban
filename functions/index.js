const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
admin.initializeApp();

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
    throw new functions.https.HttpsError('internal', 'Error sending email');
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

  try {
    // Get organization details
    const orgDoc = await admin.firestore().collection('organizations').doc(organizationId).get();
    const organization = orgDoc.data();

    // Get sender details
    const senderDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const sender = senderDoc.data();

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

  try {
    // Check if the invitation already exists
    const existingInvites = await admin.firestore()
      .collection('invitations')
      .where('inviteeEmail', '==', email.toLowerCase())
      .where('organizationId', '==', organizationId)
      .get();

    if (!existingInvites.empty) {
      throw new functions.https.HttpsError('already-exists', 'An invitation has already been sent to this email.');
    }

    // Create the invitation
    await admin.firestore().collection('invitations').add({
      organizationId,
      organizationName,
      inviteeEmail: email.toLowerCase(),
      role,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: inviterId
    });

    return { success: true };
  } catch (error) {
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

    if (response === 'accept') {
      // Logic to add user to organization
      await admin.firestore().collection('organizations').doc(invitationDoc.data().organizationId).update({
        members: admin.firestore.FieldValue.arrayUnion(context.auth.uid)
      });
      await invitationRef.update({ status: 'accepted' });
    } else if (response === 'decline') {
      await invitationRef.update({ status: 'declined' });
    }

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Function to clean up expired meeting invitations
exports.cleanupExpiredInvitations = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    const expiredInvitesQuery = await admin.firestore()
      .collection('meetingInvitations')
      .where('status', '==', 'pending')
      .where('expiresAt', '<=', now)
      .get();

    const batch = admin.firestore().batch();
    
    expiredInvitesQuery.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'expired' });
    });

    await batch.commit();
    
    return { success: true, processed: expiredInvitesQuery.size };
  } catch (error) {
    console.error('Error cleaning up expired invitations:', error);
    return { error: error.message };
  }
}); 