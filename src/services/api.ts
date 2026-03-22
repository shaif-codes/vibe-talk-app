import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';

// Determine base URL based on environment
const getBaseUrl = () => {
    // 1. Prioritize environment variable if set
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // 2. If running in Expo Go on physical device, use host machine IP
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:5001/api`;
    }

    // 3. Fallback for simulators
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5001/api';
    }

    return 'http://localhost:5001/api';
};

export const API_URL = getBaseUrl();

console.log('🔗 API URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    let token = await SecureStore.getItemAsync('authToken');

    // If we have a Firebase user, get a fresh token
    try {
        const { auth } = require('../configs/firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
            const freshToken = await currentUser.getIdToken();
            if (freshToken) {
                token = freshToken;
                await SecureStore.setItemAsync('authToken', freshToken);
            }
        }
    } catch (e) {
        console.warn('[API] Could not refresh Firebase token:', e);
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Guest User ID header for testing/dev if stored
    const guestId = await SecureStore.getItemAsync('guestUserId');
    if (guestId && __DEV__) {
        config.headers['x-test-user-id'] = guestId;
    }

    return config;
});

// Add Crashlytics response interception for logging network errors!
api.interceptors.response.use(
    (response) => {
        // Success: Log the successful request as a breadcrumb
        const url = response.config.url || 'unknown';
        crashlytics().log(`API Success: ${response.config.method?.toUpperCase()} ${url} [Status: ${response.status}]`);
        return response;
    },
    (error) => {
        // Error: Log the failure and record the error natively
        const url = error.config?.url || 'unknown';
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const status = error.response?.status || 'network_error';
        
        crashlytics().log(`API Failure: ${method} ${url} [Status: ${status}]`);
        
        // Also record this as a non-fatal error to track it
        crashlytics().recordError(error);
        
        return Promise.reject(error);
    }
);

export default api;
