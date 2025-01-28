import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut 
} from 'firebase/auth';
import { AUTH_CONFIG } from '../config/auth.config';

// Initialize Firebase
const app = initializeApp(AUTH_CONFIG.firebase);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const AuthService = {
  loginWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      return {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        provider: 'google'
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      throw new Error(error.message);
    }
  },

  loginWithGithub: async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      return {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        provider: 'github'
      };
    } catch (error) {
      console.error('Github sign in error:', error);
      throw new Error(error.message);
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(error.message);
    }
  }
}; 