import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  initializeAuth,
  browserPopupRedirectResolver,
  browserLocalPersistence
} from 'firebase/auth';

// Replace these with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfxlF7QF7N5dVcOYKPUOTyG0wjrh74_B4",
  authDomain: "volt-code-editor.firebaseapp.com",
  projectId: "volt-code-editor",
  storageBucket: "volt-code-editor.appspot.com",
  messagingSenderId: "350838245239",
  appId: "1:350838245239:web:9a2a64f592f0dd96ed0372",
  measurementId: "G-KE096RMQHJ"
};

console.log('Initializing Firebase with config:', { ...firebaseConfig, apiKey: '[REDACTED]' });
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully');

export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// User-related types
export type UserRole = 'admin' | 'editor' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: number;
  lastLoginAt: number;
}

// Admin functions
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUserRole = async (uid: string, role: UserRole) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { role }, { merge: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createOrUpdateUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// User profile functions
export const createOrUpdateUserProfile = async (user: User) => {
  if (!user.uid) return;

  const userRef = doc(db, 'users', user.uid);
  
  // Check if user already exists
  const userDoc = await getDoc(userRef);
  const existingData = userDoc.exists() ? userDoc.data() : null;
  
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    role: existingData?.role || 'user', // Keep existing role or default to 'user'
    createdAt: existingData?.createdAt || Date.now(),
    lastLoginAt: Date.now(),
  };

  try {
    await setDoc(userRef, userProfile, { merge: true });
    return userProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() as UserProfile : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

console.log('Firestore instance created');
