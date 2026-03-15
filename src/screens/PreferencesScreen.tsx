import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    // SafeAreaView is deprecated in RN Core
    ScrollView,
    TouchableOpacity,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { VibeButton } from '../components/VibeButton';
import { ChevronLeft } from 'lucide-react-native';
import { VibeAlert } from '../components/VibeAlert';
import { containerStyles } from '../configs';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

const TALK_TO_OPTIONS = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Anyone', value: 'anyone' }
];

const CONV_TYPES = [
    { label: 'Casual', value: 'casual' },
    { label: 'Deep Talk', value: 'deep' },
    { label: 'Flirt', value: 'flirt' },
    { label: 'Support', value: 'support' },
    { label: 'Timepass', value: 'timepass' }
];

const PreferencesScreen = ({ navigation, route }: any) => {
    const profileData = route.params?.profileData;
    const { user, updateUserData } = useAuth();
    const { colors, currentColors, isDark } = useTheme();

    const [talkTo, setTalkTo] = useState<string[]>(['anyone']);
    const [convTypes, setConvTypes] = useState<string[]>(['casual']);
    const [isLoading, setIsLoading] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', description: '', type: 'error' as any });

    useEffect(() => {
        if (user?.preferences) {
            if (user.preferences.talkTo) setTalkTo(user.preferences.talkTo);
            if (user.preferences.conversationType) setConvTypes(user.preferences.conversationType);
        }
    }, [user]);

    const toggleTalkTo = (val: string) => {
        if (val === 'anyone') {
            setTalkTo(['anyone']);
        } else {
            const filtered = talkTo.filter(t => t !== 'anyone');
            if (filtered.includes(val)) {
                setTalkTo(filtered.filter(t => t !== val).length === 0 ? ['anyone'] : filtered.filter(t => t !== val));
            } else {
                setTalkTo([...filtered, val]);
            }
        }
    };

    const toggleConvType = (val: string) => {
        if (convTypes.includes(val)) {
            setConvTypes(convTypes.filter(c => c !== val));
        } else {
            setConvTypes([...convTypes, val]);
        }
    };

    const handleFinish = async () => {
        setIsLoading(true);
        try {
            const preferences = {
                talkTo,
                conversationType: convTypes,
                talkativeLevel: 5
            };

            let userData;
            if (profileData?.firebaseToken) {
                // Initial social signup
                const response = await api.post('/auth/signup', {
                    ...profileData,
                    preferences
                });
                userData = response.data.user;
                // Store token (the firebase id token)
                await SecureStore.setItemAsync('authToken', profileData.firebaseToken);
            } else {
                // Update existing user or completing profile edit
                const payload = {
                    ...(profileData || {}),
                    onboarded: true,
                    preferences
                };
                const response = await api.put('/users/me', payload);
                userData = response.data.user;
            }

            // Update local storage and context
            await SecureStore.setItemAsync('userSession', JSON.stringify({ ...userData, onboarded: true }));
            await updateUserData({ ...userData, onboarded: true });

            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        } catch (error) {
            console.error('Failed to save preferences:', error);
            setAlertConfig({
                title: 'Error',
                description: 'Failed to save your preferences. Please try again.',
                type: 'error'
            });
            setIsAlertVisible(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={currentColors.text} size={24} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <VibeText variant="display" size="3xl" style={styles.title}>
                    Your Vibes
                </VibeText>
                <VibeText color={currentColors.muted} style={styles.subtitle}>
                    Who do you want to talk to today?
                </VibeText>

                {/* Talk To Section */}
                <View style={styles.section}>
                    <VibeText variant="bold" style={styles.label}>Talk To</VibeText>
                    <View style={styles.chipRow}>
                        {TALK_TO_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => toggleTalkTo(opt.value)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: talkTo.includes(opt.value) ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'),
                                    }
                                ]}
                            >
                                <VibeText
                                    variant="semiBold"
                                    size="sm"
                                    color={talkTo.includes(opt.value) ? 'white' : currentColors.text}
                                >
                                    {opt.label}
                                </VibeText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Conversation Type Section */}
                <View style={styles.section}>
                    <VibeText variant="bold" style={styles.label}>Conversation Style</VibeText>
                    <View style={styles.chipRow}>
                        {CONV_TYPES.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => toggleConvType(opt.value)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: convTypes.includes(opt.value) ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'),
                                    }
                                ]}
                            >
                                <VibeText
                                    variant="semiBold"
                                    size="sm"
                                    color={convTypes.includes(opt.value) ? 'white' : currentColors.text}
                                >
                                    {opt.label}
                                </VibeText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <VibeButton
                    title={isLoading ? "Saving..." : "Start Discovering"}
                    onPress={handleFinish}
                    loading={isLoading}
                />
            </View>

            <VibeAlert
                visible={isAlertVisible}
                type={alertConfig.type}
                title={alertConfig.title}
                description={alertConfig.description}
                onButtonPress={() => setIsAlertVisible(false)}
                onClose={() => setIsAlertVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        ...containerStyles,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    stepIndicator: {
        flexDirection: 'row',
        gap: 8,
    },
    stepDot: {
        width: 24,
        height: 6,
        borderRadius: 3,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    title: {
        marginBottom: 10,
    },
    subtitle: {
        marginBottom: 30,
        lineHeight: 22,
    },
    section: {
        marginBottom: 30,
    },
    label: {
        marginBottom: 12,
        fontSize: 16,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    }
});

export default PreferencesScreen;
