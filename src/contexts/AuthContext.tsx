import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Simple device fingerprint helper
async function getDeviceId() {
  let id = localStorage.getItem('socratic_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('socratic_device_id', id);
  }
  return id;
}

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  checkBanning: (uid: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const checkBanning = async (uid: string) => {
    const deviceId = await getDeviceId();
    
    try {
      const response = await fetch('/api/check-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, deviceId })
      });
      const data = await response.json();
      return data.isBanned || false;
    } catch (err) {
      console.error("Banning check failed:", err);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If user exists but is NOT verified, we clear the user state and profile
      if (firebaseUser && !firebaseUser.emailVerified) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const deviceId = await getDeviceId();
          const userDoc = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userDoc);
          
          let currentProfile;
          if (docSnap.exists()) {
            currentProfile = docSnap.data();
            // Update deviceId if not set or changed
            if (currentProfile.deviceId !== deviceId) {
              await updateDoc(userDoc, { deviceId });
              currentProfile.deviceId = deviceId;
            }
          } else {
            // Create initial profile if it doesn't exist
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              createdAt: serverTimestamp(),
              isPremium: false,
              deviceId: deviceId,
              isBanned: false,
              voiceGender: 'female',
              speechRate: 1,
              speechPitch: 1
            };
            await setDoc(userDoc, newProfile);
            currentProfile = newProfile;
          }

          setProfile(currentProfile);
          
          // Check for multi-account ban
          if (!currentProfile.isBanned) {
            const isBanned = await checkBanning(firebaseUser.uid);
            if (isBanned) {
              const freshDoc = await getDoc(userDoc);
              setProfile(freshDoc.data());
            }
          }

        } catch (err) {
          console.warn("Profile fetch deferred:", err);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, checkBanning }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
