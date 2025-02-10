import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, githubProvider } from '../firebase/config';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ToastProvider } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          setUser({
            ...user,
            ...userData,
            uid: user.uid
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      const userData = userDoc.data();
      
      setUser({
        ...result.user,
        ...userData,
        uid: result.user.uid
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  const signup = async ({ fullName, email, password, role, photoURL, phone }) => {
    try {
      setLoading(true);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(userCredential.user, {
        displayName: fullName,
        photoURL: photoURL || null
      });

      // Create user document in Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userData = {
        uid: userCredential.user.uid,
        fullName,
        email,
        role: role || 'developer',
        photoURL,
        phone,
        createdAt: new Date().toISOString(),
        unreadNotifications: 0,
        settings: {
          emailNotifications: true,
          pushNotifications: true
        }
      };

      await setDoc(userRef, userData);

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create/update user document in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userData = {
        uid: result.user.uid,
        fullName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        role: 'developer', // default role
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(userRef, userData, { merge: true });
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGithub = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, githubProvider);
      
      // Create/update user document in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userData = {
        uid: result.user.uid,
        fullName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        role: 'developer', // default role
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(userRef, userData, { merge: true });
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Github login error:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    login,
    signup,
    logout,
    loginWithGoogle,
    loginWithGithub
  };

  return (
    <ToastProvider>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </ToastProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 