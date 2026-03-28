import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Animated,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { VibeButton } from '../components/VibeButton';
import { GlassPanel } from '../components/GlassPanel';
import { VibeAlert } from '../components/VibeAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Heart, MessageCircle, ShieldCheck } from 'lucide-react-native';
import { containerStyles, googleAuthConfigs } from '../configs';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import crashlytics from '@react-native-firebase/crashlytics';

// Required for Expo WebBrowser
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', description: '', type: 'error' as any });

    const { loginWithGoogle, isLoading: authLoading } = useAuth();
    const { colors, currentColors, isDark, borderRadius } = useTheme();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: googleAuthConfigs.webClientId,
            offlineAccess: true,
            forceCodeForRefreshToken: true,
        });
    }, []);

    const handleGoogleLogin = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();

            const idToken = response.data?.idToken;

            if (!idToken) {
                throw new Error('No ID Token received from Google');
            }

            const result = await loginWithGoogle(idToken);
            if (result.requiresSignup) {
                navigation.navigate('ProfileSetup', { firebaseToken: idToken });
            }
        } catch (error: any) {
            console.log("Error", error)
            crashlytics().log('Google Sign-In Modal Flow failed or was cancelled');
            crashlytics().recordError(error instanceof Error ? error : new Error(String(error)));
            
            setAlertConfig({
                title: 'Login Failed',
                description: `Unable to sign in with Google (Error: ${error.code || 'Unknown'}). Please try again.`,
                type: 'error'
            });
            setIsAlertVisible(true);
        }
    };

    const floatAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20],
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            {/* Background Blobs */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={[styles.blob, { top: -40, left: -40, backgroundColor: isDark ? '#ee2b8c33' : '#ee2b8c11', width: 240, height: 240 }]} />
                <View style={[styles.blob, { bottom: height * 0.3, right: -60, backgroundColor: isDark ? '#a855f722' : '#a855f705', width: 300, height: 300 }]} />
            </View>

            <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoRow}>
                    <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
                        <Sparkles color="white" size={24} />
                    </View>
                    <VibeText variant="display" size="2xl" style={{ marginLeft: 10 }}>Half-found</VibeText>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Animated.View style={{ transform: [{ translateY }] }}>
                        <View style={styles.heroImageWrapper}>
                            <LinearGradient
                                colors={['rgba(238, 43, 140, 0.2)', 'rgba(168, 85, 247, 0.1)']}
                                style={styles.heroGlow}
                            />
                            <GlassPanel style={styles.heroPanel}>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhLa63hMlGYQgzPFOSybE5xYBnKe-VMWn69ls7BxqD8RN-5VMZli9xrxVFSGKtnprOZAJbpP5XXe0O0P7ri1JwwyvJ01LsoTxoSniJt__r0N__MRY-VDNscDdCLiqhVibuDIYJ3jf7xWq9gEJHbKiCcvSBzt92TQPVcWYw84HdN1bf2sKk6zJA1mP4avqiv6g7vmLcGZFJ8ddNL3hatR0Us_viYyMPPK4UG5Ah07WOUcPkIqr3-ahZbWWdwGC38VVqI-Tl11IshR4' }}
                                    style={styles.illustration}
                                    resizeMode="contain"
                                />
                            </GlassPanel>

                            {/* Floating decorations */}
                            <View style={[styles.floatingIcon, { top: 0, right: 0 }]}>
                                <Heart color={colors.primary} size={20} fill={colors.primary} />
                            </View>
                            <View style={[styles.floatingIcon, { bottom: 20, left: -10 }]}>
                                <MessageCircle color={colors.accent.blue} size={20} fill={colors.accent.blue} />
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* Text content */}
                <View style={styles.textContent}>
                    <VibeText variant="display" size="4xl" style={styles.title}>
                        Talk to someone. {'\n'}
                        <VibeText variant="display" size="4xl" color={colors.primary}>Feel less alone.</VibeText>
                    </VibeText>
                    <VibeText variant="medium" size="lg" color={currentColors.muted} style={styles.subtitle}>
                        A safe, privacy-first space for friendly conversations.
                    </VibeText>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <VibeButton
                        title={authLoading ? "Signing in..." : "Continue with Google"}
                        onPress={handleGoogleLogin}
                        loading={authLoading}
                        icon={
                            <Image
                                source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
                                style={{ width: 24, height: 24 }}
                            />
                        }
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.privacyRow}>
                        <ShieldCheck size={14} color={currentColors.muted} />
                        <VibeText size="xs" color={currentColors.muted} style={{ marginLeft: 5 }}>
                            Privacy-first & Anonymous
                        </VibeText>
                    </View>
                    <VibeText size="xs" color={currentColors.muted} style={styles.termsText}>
                        By continuing, you agree to our Terms and Privacy Policy.
                    </VibeText>
                </View>
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
    blob: {
        position: 'absolute',
        borderRadius: 150,
        opacity: 0.6,
        transform: [{ scale: 1.5 }],
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingVertical: 20,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    logoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    heroImageWrapper: {
        width: width * 0.7,
        height: width * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: (width * 0.7) / 2,
        filter: 'blur(30px)',
    },
    heroPanel: {
        width: '100%',
        height: '100%',
        borderRadius: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustration: {
        width: '80%',
        height: '80%',
    },
    floatingIcon: {
        position: 'absolute',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    textContent: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 40,
    },
    subtitle: {
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    actions: {
        width: '100%',
        marginBottom: 30,
    },
    footer: {
        alignItems: 'center',
    },
    privacyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    termsText: {
        textAlign: 'center',
        opacity: 0.7,
    }
});

export default LoginScreen;
