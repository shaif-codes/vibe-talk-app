import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// These should be from your Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyDj3PNwInBwsMahY4WEA_PNB9OdsEcVhdE",
    authDomain: "vibetalk-aa16c.firebaseapp.com",
    projectId: "vibetalk-aa16c",
    storageBucket: "vibetalk-aa16c.firebasestorage.app",
    messagingSenderId: "223159541122",
    appId: "1:223159541122:android:a6926ba52eed8ff7ad039b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
})

export default app;
