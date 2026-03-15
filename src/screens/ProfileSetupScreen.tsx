import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    // SafeAreaView is deprecated in RN Core, use from context instead
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { VibeButton } from '../components/VibeButton';
import { GlassPanel } from '../components/GlassPanel';
import { ChevronLeft, Info, User2 } from 'lucide-react-native';
import { VibeAlert } from '../components/VibeAlert';
import { containerStyles } from '../configs';

const { width } = Dimensions.get('window');

const AGE_RANGES = ['18-21', '22-25', '26-30', '31+'];
const GENDERS = ['male', 'female', 'non-binary', 'prefer-not-say'];

const ProfileSetupScreen = ({ navigation, route }: any) => {
    const { user } = useAuth();
    const { colors, currentColors, isDark, borderRadius, spacing } = useTheme();

    const [nickname, setNickname] = useState('');
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', description: '', type: 'error' as any });
    const [bio, setBio] = useState('');
    const [age, setAge] = useState('22-25');
    const [gender, setGender] = useState<'male' | 'female' | 'non-binary' | 'prefer-not-say'>('prefer-not-say');

    const firebaseToken = route.params?.firebaseToken;

    useEffect(() => {
        if (user) {
            if (user.nickname) setNickname(user.nickname);
            if ((user as any).bio) setBio((user as any).bio);
            if ((user as any).age) setAge((user as any).age);
            if ((user as any).gender) setGender((user as any).gender);
        }
    }, [user]);

    const handleContinue = () => {
        if (firebaseToken && !nickname.trim()) {
            setAlertConfig({
                title: 'Required',
                description: 'Please pick a nickname to continue.',
                type: 'info'
            });
            setIsAlertVisible(true);
            return;
        }
        navigation.navigate('Preferences', {
            profileData: { nickname, bio, age, gender, firebaseToken }
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={currentColors.text} size={24} />
                    </TouchableOpacity>
                    <View style={styles.stepIndicator}>
                        <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
                        <View style={[styles.stepDot, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <VibeText variant="display" size="3xl" style={styles.title}>
                        Create your Profile
                    </VibeText>
                    <VibeText color={currentColors.muted} style={styles.subtitle}>
                        This helps us find the best vibes for you.
                    </VibeText>

                    {/* Nickname Section - Only for social signup */}
                    {firebaseToken && (
                        <View style={styles.section}>
                            <VibeText variant="bold" style={styles.label}>Choose a Nickname</VibeText>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                        borderColor: isDark ? colors.glass.border : '#ddd',
                                        color: currentColors.text,
                                        borderRadius: borderRadius.md
                                    }
                                ]}
                                placeholder="How should vibes call you?"
                                placeholderTextColor={currentColors.muted}
                                value={nickname}
                                onChangeText={setNickname}
                            />
                        </View>
                    )}

                    {/* Bio Section */}
                    <View style={styles.section}>
                        <VibeText variant="bold" style={styles.label}>About You</VibeText>
                        <TextInput
                            style={[
                                styles.bioInput,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                    borderColor: isDark ? colors.glass.border : '#ddd',
                                    color: currentColors.text,
                                    borderRadius: borderRadius.md
                                }
                            ]}
                            placeholder="Tell us a little about yourself (e.g. Loves music, late night chats...)"
                            placeholderTextColor={currentColors.muted}
                            multiline
                            maxLength={60}
                            value={bio}
                            onChangeText={setBio}
                        />
                        <VibeText size="xs" color={currentColors.muted} style={{ alignSelf: 'flex-end', marginTop: 5 }}>
                            {bio.length}/60
                        </VibeText>
                    </View>

                    {/* Age Section */}
                    <View style={styles.section}>
                        <VibeText variant="bold" style={styles.label}>Age Range</VibeText>
                        <View style={styles.chipRow}>
                            {AGE_RANGES.map((range) => (
                                <TouchableOpacity
                                    key={range}
                                    onPress={() => setAge(range as any)}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: age === range ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'),
                                        }
                                    ]}
                                >
                                    <VibeText
                                        variant="semiBold"
                                        size="sm"
                                        color={age === range ? 'white' : currentColors.text}
                                    >
                                        {range}
                                    </VibeText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Gender Section */}
                    <View style={styles.section}>
                        <VibeText variant="bold" style={styles.label}>Gender (Optional)</VibeText>
                        <View style={styles.chipRow}>
                            {GENDERS.map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    onPress={() => setGender(g as any)}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: gender === g ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'),
                                        }
                                    ]}
                                >
                                    <VibeText
                                        variant="semiBold"
                                        size="sm"
                                        color={gender === g ? 'white' : currentColors.text}
                                    >
                                        {g === 'prefer-not-say' ? 'Skip' : g.charAt(0).toUpperCase() + g.slice(1)}
                                    </VibeText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <VibeButton
                        title="Continue"
                        onPress={handleContinue}
                    />
                </View>
            </KeyboardAvoidingView>

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
    bioInput: {
        height: 100,
        padding: 16,
        paddingTop: 16,
        borderWidth: 1,
        textAlignVertical: 'top',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    input: {
        height: 56,
        paddingHorizontal: 20,
        borderWidth: 1,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        minWidth: 70,
        alignItems: 'center',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    }
});

export default ProfileSetupScreen;
