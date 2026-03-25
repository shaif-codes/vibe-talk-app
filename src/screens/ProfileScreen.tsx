import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Switch,
    Alert,
    Modal,
    FlatList,
    Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { useAuth } from '../context/AuthContext';
import { VibeAlert } from '../components/VibeAlert';
import api from '../services/api';
import {
    User,
    Settings,
    ShieldCheck,
    Moon,
    Sun,
    LogOut,
    ChevronRight,
    Heart,
    Flame,
    MessageCircle,
    Bell,
    Globe,
    Monitor,
    Check,
    X,
    Wallet
} from 'lucide-react-native';
import { containerStyles } from '../configs';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = ({ navigation }: any) => {
    const { user, logout, themePreference, setThemePreference, updateUserData } = useAuth();
    const { colors, currentColors, isDark } = useTheme();
    const [stats, setStats] = useState({ sessions: 0, activeTime: '0h', streaks: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [alertConfig, setAlertConfig] = useState<any>({ visible: false, title: '', description: '', type: 'info' });
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

    const LANGUAGES = [
        { name: 'English', code: 'en' },
        { name: 'Hindi', code: 'hi' },
        { name: 'Spanish', code: 'es' },
        { name: 'French', code: 'fr' },
        { name: 'German', code: 'de' },
        { name: 'Japanese', code: 'ja' },
        { name: 'Korean', code: 'ko' },
        { name: 'Arabic', code: 'ar' },
        { name: 'Portuguese', code: 'pt' },
        { name: 'Russian', code: 'ru' }
    ];

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/users/me/stats');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const toggleTheme = () => {
        const nextTheme = themePreference === 'light' ? 'dark' : (themePreference === 'dark' ? 'system' : 'light');
        setThemePreference(nextTheme);
    };

    const handleLanguageSelect = async (languageName: string) => {
        try {
            // Update backend
            await api.put('/users/me', { language: languageName });
            // Update context
            await updateUserData({ language: languageName });
            setIsLanguageModalVisible(false);
        } catch (error) {
            console.error('Failed to update language:', error);
            Alert.alert("Error", "Failed to update language preferences.");
        }
    };

    const handleLogout = () => {
        setAlertConfig({
            visible: true,
            title: 'Leaving so soon?',
            description: 'Your vibes will be saved. We’ll be right here when you’re ready to tune back in.',
            buttonText: 'Logout',
            type: 'info',
            onButtonPress: async () => {
                setAlertConfig({ ...alertConfig, visible: false });
                logout();
            },
            onClose: () => setAlertConfig({ ...alertConfig, visible: false }),
            secondaryButtonText: 'Stay Vibe',
            onSecondaryButtonPress: () => setAlertConfig({ ...alertConfig, visible: false })
        });
    };

    const handleDeleteAccount = () => {
        setAlertConfig({
            visible: true,
            title: 'Clear everything?',
            description: 'This will permanently manifest your data out of existence. This action cannot be undone.',
            buttonText: 'Delete Permanently',
            type: 'error',
            onButtonPress: async () => {
                setAlertConfig({ ...alertConfig, visible: false });
                try {
                    await api.delete('/users/me');
                    logout();
                } catch (error) {
                    Alert.alert("Error", "Failed to delete account. Try again.");
                }
            },
            onClose: () => setAlertConfig({ ...alertConfig, visible: false }),
            secondaryButtonText: 'Cancel',
            onSecondaryButtonPress: () => setAlertConfig({ ...alertConfig, visible: false })
        });
    };

    const SettingItem = ({ icon: Icon, title, value, onPress, showSwitch, switchValue, onSwitchChange, color }: any) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}
            onPress={onPress}
            disabled={showSwitch}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }]}>
                    <Icon size={20} color={color || currentColors.text} />
                </View>
                <VibeText variant="medium" size="md" style={{ color: color || currentColors.text }}>{title}</VibeText>
            </View>
            <View style={styles.settingRight}>
                {value && <VibeText color={currentColors.muted} size="sm" style={{ marginRight: 8 }}>{value}</VibeText>}
                {showSwitch ? (
                    <Switch
                        value={switchValue}
                        onValueChange={onSwitchChange}
                        trackColor={{ false: '#767577', true: colors.primary }}
                        thumbColor={switchValue ? 'white' : '#f4f3f4'}
                    />
                ) : (
                    <ChevronRight size={18} color={currentColors.muted} />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={[colors.primary, '#ff4fa1']}
                            style={styles.avatarGradient}
                        >
                            <View style={[styles.avatarBorder, { backgroundColor: currentColors.surface }]}>
                                <User size={48} color={colors.primary} />
                            </View>
                        </LinearGradient>
                        <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                            <Settings size={12} color="white" />
                        </TouchableOpacity>
                    </View>
                    <VibeText variant="display" size="2xl" style={styles.nickname}>
                        {user?.nickname || 'Viber'}
                    </VibeText>
                    <VibeText color={currentColors.muted} size="sm">@{user?.nickname?.toLowerCase() || 'stranger'}</VibeText>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statBox, { backgroundColor: currentColors.surface }]}>
                        <VibeText variant="bold" size="lg">{stats.sessions}</VibeText>
                        <VibeText size="xs" color={currentColors.muted}>Vibes</VibeText>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: currentColors.surface }]}>
                        <VibeText variant="bold" size="lg">{stats.streaks}</VibeText>
                        <VibeText size="xs" color={currentColors.muted}>Streaks</VibeText>
                    </View>
                    <TouchableOpacity style={[styles.statBox, { backgroundColor: currentColors.surface }]} onPress={() => navigation.navigate('Wallet')}>
                        <VibeText variant="bold" size="lg">{user?.walletBalance?.toLocaleString() || '0'}</VibeText>
                        <VibeText size="xs" color={currentColors.muted}>Coins</VibeText>
                    </TouchableOpacity>
                </View>

                {/* Settings Groups */}
                <View style={styles.section}>
                    <VibeText variant="bold" size="xs" color={currentColors.muted} style={styles.sectionTitle}>
                        ACCOUNT & PREFERENCES
                    </VibeText>
                    <View style={[styles.group, { backgroundColor: currentColors.surface }]}>
                        <SettingItem icon={Wallet} title="Wallet & Coins" value={`${user?.walletBalance || 0} Coins`} onPress={() => navigation.navigate('Wallet')} />
                        <SettingItem icon={User} title="Edit Profile" onPress={() => navigation.navigate('ProfileSetup')} />
                        <SettingItem icon={Heart} title="Match Preferences" onPress={() => navigation.navigate('Preferences')} />
                        <SettingItem icon={Bell} title="Notifications" value="All On" />
                        <SettingItem
                            icon={Globe}
                            title="Language"
                            value={user?.language || 'English'}
                            onPress={() => setIsLanguageModalVisible(true)}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <VibeText variant="bold" size="xs" color={currentColors.muted} style={styles.sectionTitle}>
                        APP & SAFETY
                    </VibeText>
                    <View style={[styles.group, { backgroundColor: currentColors.surface }]}>
                        <SettingItem
                            icon={themePreference === 'dark' ? Moon : (themePreference === 'light' ? Sun : Monitor)}
                            title="Theme"
                            value={themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}
                            onPress={toggleTheme}
                        />
                        <SettingItem icon={ShieldCheck} title="Privacy Center" />
                        <SettingItem icon={MessageCircle} title="Support & Feedback" onPress={() => navigation.navigate('Support')} />
                        <SettingItem
                            icon={LogOut}
                            title="Delete Account"
                            color="#ff4444"
                            onPress={handleDeleteAccount}
                        />
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.logoutBtn, { backgroundColor: isDark ? 'rgba(255,68,68,0.1)' : '#fff1f1', borderColor: 'rgba(255,68,68,0.2)' }]}
                    onPress={handleLogout}
                >
                    <LogOut size={20} color="#ff4444" />
                    <VibeText variant="bold" color="#ff4444" style={{ marginLeft: 12 }}>Sign Out</VibeText>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <VibeText size="xs" color={currentColors.muted}>Half-found v1.0.0</VibeText>
                    <VibeText size="xs" color={currentColors.muted} style={{ marginTop: 4 }}>End-to-End Encrypted</VibeText>
                </View>
            </ScrollView>

            <VibeAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                description={alertConfig.description}
                type={alertConfig.type}
                buttonText={alertConfig.buttonText}
                onButtonPress={alertConfig.onButtonPress}
                onClose={alertConfig.onClose}
                secondaryButtonText={alertConfig.secondaryButtonText}
                onSecondaryButtonPress={alertConfig.onSecondaryButtonPress}
            />

            <Modal
                visible={isLanguageModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsLanguageModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setIsLanguageModalVisible(false)}
                >
                    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                    <View style={[styles.modalContent, { backgroundColor: currentColors.surface }]}>
                        <View style={styles.modalHeader}>
                            <VibeText variant="bold" size="lg">Select Language</VibeText>
                            <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                                <X size={24} color={currentColors.text} />
                            </TouchableOpacity>
                        </View>

                        <VibeText size="sm" color={currentColors.muted} style={{ marginBottom: 20 }}>
                            Choose the language you'd like to chat in. Personas will adjust their vibe to match yours.
                        </VibeText>

                        <FlatList
                            data={LANGUAGES}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.languageItem}
                                    onPress={() => handleLanguageSelect(item.name)}
                                >
                                    <VibeText
                                        variant={user?.language === item.name ? "semiBold" : "regular"}
                                        color={user?.language === item.name ? colors.primary : currentColors.text}
                                    >
                                        {item.name}
                                    </VibeText>
                                    {user?.language === item.name && (
                                        <Check size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]} />}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        ...containerStyles,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 32,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        padding: 3,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '100%',
        maxHeight: '70%',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    separator: {
        height: 1,
    },
    avatarBorder: {
        flex: 1,
        borderRadius: 47,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    nickname: {
        marginBottom: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        paddingHorizontal: 24,
        marginBottom: 12,
        letterSpacing: 1,
    },
    group: {
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 8,
        height: 60,
        borderRadius: 24,
        borderWidth: 1,
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
    }
});

export default ProfileScreen;
