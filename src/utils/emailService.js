import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

const functions = getFunctions(app);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const sendEmailFunction = httpsCallable(functions, 'sendEmail');
    await sendEmailFunction({
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 