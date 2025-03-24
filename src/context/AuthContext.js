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
  setDoc,
  updateDoc
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
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          console.error('Auth state change: User document not found in Firestore');
          // Create basic user document if it doesn't exist
          const basicUserData = {
            uid: user.uid,
            email: user.email,
            fullName: user.displayName || '',
            role: 'developer', // Default role
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          
          try {
            await setDoc(doc(db, 'users', user.uid), basicUserData);
            setUser({
              ...user,
              ...basicUserData
            });
          } catch (error) {
            console.error('Error creating missing user document:', error);
            setUser(null);
            setLoading(false);
            return;
          }
        } else {
          const userData = userDoc.data();
          console.log('Auth state change: User data loaded:', userData);
          
          setUser({
            ...user,
            ...userData,
            uid: user.uid
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        console.error('User document not found in Firestore');
        throw new Error('User data not found. Please contact support.');
      }
      
      const userData = userDoc.data();
      
      // Update lastLogin time
      await updateDoc(doc(db, 'users', result.user.uid), {
        lastLogin: new Date().toISOString()
      });
      
      // Log user data for debugging
      console.log('User data from Firestore:', userData);
      
      setUser({
        ...result.user,
        ...userData,
        uid: result.user.uid
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
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
      
      // First check if user already exists
      const userDoc = await getDoc(userRef);
      const existingUserData = userDoc.exists() ? userDoc.data() : null;
      
      const userData = {
        uid: result.user.uid,
        fullName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        // Only set default role if user doesn't exist yet
        ...(existingUserData ? {} : { role: 'developer' }),
        lastLogin: new Date().toISOString(),
      };

      // Use merge true to preserve existing data including roles
      await setDoc(userRef, userData, { merge: true });
      
      // Get complete user data after update
      const updatedUserDoc = await getDoc(userRef);
      const updatedUserData = updatedUserDoc.data();
      
      setUser({
        ...result.user,
        ...updatedUserData
      });
      
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
      
      // First check if user already exists
      const userDoc = await getDoc(userRef);
      const existingUserData = userDoc.exists() ? userDoc.data() : null;
      
      const userData = {
        uid: result.user.uid,
        fullName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        // Only set default role if user doesn't exist yet
        ...(existingUserData ? {} : { role: 'developer' }),
        lastLogin: new Date().toISOString(),
      };

      // Use merge true to preserve existing data including roles
      await setDoc(userRef, userData, { merge: true });
      
      // Get complete user data after update
      const updatedUserDoc = await getDoc(userRef);
      const updatedUserData = updatedUserDoc.data();
      
      setUser({
        ...result.user,
        ...updatedUserData
      });
      
      return true;
    } catch (error) {
      console.error('Github login error:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to verify and fix user role if needed
  const verifyUserRole = async (uid, expectedRole) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('User document not found');
        return false;
      }
      
      const userData = userDoc.data();
      
      if (userData.role !== expectedRole) {
        console.log(`Fixing user role: Current=${userData.role}, Expected=${expectedRole}`);
        
        await updateDoc(userRef, {
          role: expectedRole,
          roleFixedAt: new Date().toISOString(),
          previousRole: userData.role
        });
        
        // Update local user state
        setUser(prev => ({
          ...prev,
          role: expectedRole
        }));
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying user role:', error);
      return false;
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
    loginWithGithub,
    verifyUserRole
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