import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type User = {
  id: string; // Firebase UID
  username: string;
  role: string;
  verified: boolean;
  karma: number;
} | null;

interface AuthContextType {
  user: User;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch or create user in Firestore
        const userRef = doc(db, 'users', fbUser.uid);
        let userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Initialize fresh user profile
          const newUser = {
            username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: fbUser.email === 'edredmandalunes@gmail.com' ? 'admin' : 'user',
            verified: false,
            karma: 0,
            createdAt: Date.now()
          };
          await setDoc(userRef, newUser);
          setUser({ id: fbUser.uid, ...newUser } as User);
        } else {
          const uData = userDoc.data();
          // Retroactive admin upgrade
          if (fbUser.email === 'edredmandalunes@gmail.com' && uData.role !== 'admin') {
             await setDoc(userRef, { role: 'admin' }, { merge: true });
             uData.role = 'admin';
          }
          setUser({ id: fbUser.uid, ...uData } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
