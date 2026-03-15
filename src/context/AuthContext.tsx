import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { auth } from '../configs/firebase';
import {
    onAuthStateChanged,
    signInWithCredential,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';

interface User {
    id: string;
    nickname: string;
    isGuest: boolean;
    onboarded: boolean;
    token?: string;
    themePreference?: 'light' | 'dark' | 'system';
    bio?: string;
    age?: string;
    gender?: string;
    language?: string;
    preferences?: {
        talkTo: string[];
        conversationType: string[];
        talkativeLevel: number;
    };
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    themePreference: 'light' | 'dark' | 'system';
    setThemePreference: (pref: 'light' | 'dark' | 'system') => Promise<void>;
    loginAsGuest: (nickname: string) => Promise<void>;
    loginWithGoogle: (firebaseToken: string) => Promise<{ requiresSignup?: boolean }>;
    updateUserData: (data: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [themePreference, setThemePreferenceState] = useState<'light' | 'dark' | 'system'>('system');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load theme preference early
        const loadTheme = async () => {
            const savedTheme = await SecureStore.getItemAsync('themePreference');
            if (savedTheme) {
                setThemePreferenceState(savedTheme as any);
            }
        };
        loadTheme();
    }, []);

    useEffect(() => {
        // Listen for Firebase Auth changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const token = await firebaseUser.getIdToken();
                    await SecureStore.setItemAsync('authToken', token);

                    // Fetch user details from our backend
                    const response = await api.get('/auth/me');
                    setUser({ ...response.data.user, isGuest: false });
                } catch (error) {
                    console.log('Firebase user detected, pending backend sync');
                }
            } else {
                // Not in Firebase, check if there's a guest session
                const guestUserStr = await SecureStore.getItemAsync('userSession');
                if (guestUserStr) {
                    const userData = JSON.parse(guestUserStr);
                    if (userData.isGuest) {
                        setUser(userData);
                        if (userData.themePreference) {
                            setThemePreferenceState(userData.themePreference);
                        }
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginAsGuest = async (nickname: string) => {
        setIsLoading(true);
        try {
            // Call Guest Signup API
            const response = await api.post('/auth/guest', {
                nickname,
                age: '22-25' // Default for guest quick start
            });

            const { user: userData, token } = response.data;

            // Store session
            if (token) {
                await SecureStore.setItemAsync('authToken', token);
            }

            await SecureStore.setItemAsync('userSession', JSON.stringify(userData));

            // For dev/test mode API testing
            if (__DEV__) {
                await SecureStore.setItemAsync('guestUserId', userData.id);
            }

            setUser({ ...userData, token, isGuest: true });

        } catch (error) {
            console.error('Guest login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };
    const loginWithGoogle = async (googleIdToken: string) => {
        setIsLoading(true);
        try {
            // 1. Sign in to Firebase on the frontend
            const credential = GoogleAuthProvider.credential(googleIdToken);
            const userCredential = await signInWithCredential(auth, credential);
            const firebaseToken = await userCredential.user.getIdToken();

            // 2. Authenticate with our backend using the Firebase ID Token
            const response = await api.post('/auth/login', { firebaseToken });
            const { user: userData } = response.data;

            await SecureStore.setItemAsync('authToken', firebaseToken);
            await SecureStore.setItemAsync('userSession', JSON.stringify({ ...userData, isGuest: false }));

            setUser({ ...userData, token: firebaseToken, isGuest: false });
            return { requiresSignup: false };
        } catch (error: any) {
            if (error.response?.status === 404 && error.response?.data?.requiresSignup) {
                return { requiresSignup: true };
            }
            console.error('Google login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserData = async (data: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        await SecureStore.setItemAsync('userSession', JSON.stringify(updatedUser));
    };

    const setThemePreference = async (pref: 'light' | 'dark' | 'system') => {
        setThemePreferenceState(pref);
        await SecureStore.setItemAsync('themePreference', pref);

        // Sync with backend if user is logged in
        if (user) {
            try {
                await api.put('/users/me', { themePreference: pref });
            } catch (error) {
                console.error('Failed to sync theme preference to backend:', error);
            }
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await firebaseSignOut(auth);
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('userSession');
            await SecureStore.deleteItemAsync('guestUserId');
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            themePreference,
            setThemePreference,
            loginAsGuest,
            loginWithGoogle,
            updateUserData,
            logout
        }}>
            {children}
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
