import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup, 
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase/config';

export const AuthService = {
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  signup: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  loginWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  loginWithGithub: async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      return result.user;
    } catch (error) {
      console.error('Github login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}; 