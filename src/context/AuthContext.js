import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  GithubAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { AUTH_CONFIG } from '../config/auth.config';

// Initialize Firebase
const app = initializeApp(AUTH_CONFIG.firebase);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const userRoles = {
    ADMIN: 'admin',
    DEVELOPER: 'developer',
    PROJECT_MANAGER: 'project_manager'
  };

  const [user, setUser] = useState({
    uid: null,
    email: null,
    role: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: null
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        role: null
      };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGithub = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, githubProvider);
      const user = {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        role: null
      };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
    } catch (err) {
      setError(err.message);
    }
  };

  const signup = async ({ fullName, email, password }) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const user = {
        id: result.user.uid,
        email: result.user.email,
        name: fullName,
        role: null
      };

      await updateProfile(result.user, {
        displayName: fullName
      });

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        role: null
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    loginWithGoogle,
    loginWithGithub,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 