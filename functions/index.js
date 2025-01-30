const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

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
    const { to, subject, html } = data;

    const mailOptions = {
      from: functions.config().email.user,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Error sending email');
  }
}); 