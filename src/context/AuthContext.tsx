import * as React from 'react';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import notificationService from '../services/notificationService';
import crashlytics from '@react-native-firebase/crashlytics';
import { auth } from '../configs/firebase';
import {
    onAuthStateChanged,
    signInWithCredential,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';
import socketService from '../services/socket';

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
    walletBalance?: number;
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
    loginWithGoogle: (firebaseToken: string) => Promise<{ requiresSignup?: boolean }>;
    updateUserData: (data: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [themePreference, setThemePreferenceState] = useState<'light' | 'dark' | 'system'>('system');
    const [isLoading, setIsLoading] = useState(true);
    // Guard flag: prevents onAuthStateChanged from racing with loginWithGoogle
    const isHandlingLogin = useRef(false);

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
                // Skip if loginWithGoogle is currently handling auth to avoid race condition
                if (isHandlingLogin.current) return;
                try {
                    const token = await firebaseUser.getIdToken();
                    await SecureStore.setItemAsync('authToken', token);

                    // Fetch user details from our backend (app resume / token refresh)
                    const response = await api.get('/auth/me');
                    setUser({ ...response.data.user, isGuest: false });
                } catch (error) {
                    console.log('Firebase user detected, pending backend sync');
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async (googleIdToken: string) => {
        setIsLoading(true);
        isHandlingLogin.current = true;
        try {
            crashlytics().log('Attempting Google login via Firebase SDK');
            
            // 1. Sign in to Firebase on the frontend
            const credential = GoogleAuthProvider.credential(googleIdToken);
            const userCredential = await signInWithCredential(auth, credential);
            const firebaseToken = await userCredential.user.getIdToken();

            crashlytics().log('Firebase login successful, attempting Backend sync');

            // 2. Authenticate with our backend using the Firebase ID Token
            const response = await api.post('/auth/login', { firebaseToken });
            const { user: userData } = response.data;

            await SecureStore.setItemAsync('authToken', firebaseToken);
            await SecureStore.setItemAsync('userSession', JSON.stringify({ ...userData, isGuest: false }));

            setUser({ ...userData, token: firebaseToken, isGuest: false });

            // Register for push notifications
            notificationService.registerForPushNotifications().catch(err => {
                console.error('Failed to register for push notifications:', err);
                crashlytics().recordError(err);
            });

            return { requiresSignup: false };
        } catch (error: any) {
            if (error.response?.status === 404 && error.response?.data?.requiresSignup) {
                return { requiresSignup: true };
            }
            crashlytics().log('Google login completely failed either natively or via API');
            crashlytics().recordError(error);
            
            console.error('Google login failed:', error);
            throw error;
        } finally {
            isHandlingLogin.current = false;
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
            // Unregister FCM token before logout
            await notificationService.unregisterToken().catch(err => {
                console.error('Failed to unregister FCM token:', err);
            });

            await firebaseSignOut(auth);
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('userSession');
            setUser(null);
            socketService.logout();
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
