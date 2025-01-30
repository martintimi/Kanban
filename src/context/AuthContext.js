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
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { AUTH_CONFIG } from '../config/auth.config';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../utils/sessionManager';

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

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: userDoc.data()?.role || 'developer'
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error getting user data:', error);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
      if (!firebaseUser) {
        sessionManager.clearTimer();
      }
    });

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
      sessionManager.clearTimer();
      setUser(null);
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const signup = async ({ fullName, email, password, role }) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore with role
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        fullName,
        email,
        role,
        createdAt: new Date().toISOString()
      });

      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        name: fullName,
        role: role
      };

      await updateProfile(result.user, {
        displayName: fullName
      });

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
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
      
      // Get user data including role from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        role: userDoc.data()?.role || 'developer'
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
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