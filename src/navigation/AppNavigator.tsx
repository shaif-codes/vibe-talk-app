import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { VibeLoader } from '../components/VibeLoader';

// Screens (Placeholder imports for now)
import LoginScreen from '../screens/LoginScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import SessionsScreen from '../screens/SessionsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
    const { user, isLoading } = useAuth();
    const { currentColors, isDark } = useTheme();

    if (isLoading) {
        return <VibeLoader advanced size={60} />;
    }

    return (
        <NavigationContainer theme={{
            dark: isDark,
            colors: {
                primary: '#ee2b8c',
                background: currentColors.background,
                card: currentColors.surface,
                text: currentColors.text,
                border: isDark ? 'rgba(255,255,255,0.1)' : '#eee',
                notification: '#ee2b8c',
            },
            fonts: {
                regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
                medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
                bold: { fontFamily: 'sans-serif', fontWeight: 'bold' },
                heavy: { fontFamily: 'sans-serif', fontWeight: '900' },
            }
        }}>
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: currentColors.background } }}>
                {user ? (
                    user.onboarded ? (
                        // Authenticated Stack
                        <>
                            <Stack.Screen name="Home" component={HomeScreen} />
                            <Stack.Screen name="Chat" component={ChatScreen} />
                            <Stack.Screen name="Sessions" component={SessionsScreen} />
                            <Stack.Screen name="Profile" component={ProfileScreen} />
                            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                            <Stack.Screen name="Preferences" component={PreferencesScreen} />
                        </>
                    ) : (
                        // Onboarding Stack
                        <>
                            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                            <Stack.Screen name="Preferences" component={PreferencesScreen} />
                        </>
                    )
                ) : (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                        <Stack.Screen name="Preferences" component={PreferencesScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
