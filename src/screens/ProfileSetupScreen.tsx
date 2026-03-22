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
    Modal,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { VibeButton } from '../components/VibeButton';
import { GlassPanel } from '../components/GlassPanel';
import { ChevronLeft, Info, User2, MapPin, Globe, Search, X } from 'lucide-react-native';
import { VibeAlert } from '../components/VibeAlert';
import { containerStyles } from '../configs';
import countryData from '../../assets/contryData.json';

const { width, height } = Dimensions.get('window');

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
    
    // New state for country and language
    const [country, setCountry] = useState<{name: string, emoji: string} | null>(null);
    const [language, setLanguage] = useState('');
    
    // Modal state for country picker
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState('');

    const firebaseToken = route.params?.firebaseToken;

    useEffect(() => {
        if (user) {
            if (user.nickname) setNickname(user.nickname);
            if ((user as any).bio) setBio((user as any).bio);
            if ((user as any).age) setAge((user as any).age);
            if ((user as any).gender) setGender((user as any).gender);
            if ((user as any).language) setLanguage((user as any).language);
            if ((user as any).country) {
                // If country is stored as string, we can try to find its emoji, or if it's an object we can set it.
                // Assuming it will be stored as the country name string in backend.
                const countryKey = Object.keys(countryData).find(key => (countryData as any)[key].name === (user as any).country);
                if (countryKey) {
                    setCountry({ name: (countryData as any)[countryKey].name, emoji: (countryData as any)[countryKey].emoji });
                } else {
                    // Fallback if we can't find it
                    setCountry({ name: (user as any).country, emoji: '🌍' });
                }
            }
        }
    }, [user]);

    const countriesList = Object.keys(countryData).map(key => ({
        code: key,
        ...(countryData as any)[key]
    })).filter(c => c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()));

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
        if (!country) {
            setAlertConfig({
                title: 'Required',
                description: 'Please select your country to continue.',
                type: 'info'
            });
            setIsAlertVisible(true);
            return;
        }

        navigation.navigate('Preferences', {
            profileData: { nickname, bio, age, gender, language, country: country.name, firebaseToken }
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

                    {/* Country Section */}
                    <View style={styles.section}>
                        <VibeText variant="bold" style={styles.label}>Country</VibeText>
                        <TouchableOpacity
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                    borderColor: isDark ? colors.glass.border : '#ddd',
                                    borderRadius: borderRadius.md,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }
                            ]}
                            onPress={() => setIsCountryModalVisible(true)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <MapPin color={currentColors.muted} size={20} />
                                <VibeText color={country ? currentColors.text : currentColors.muted}>
                                    {country ? `${country.emoji} ${country.name}` : 'Select your Country'}
                                </VibeText>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Language Section */}
                    <View style={styles.section}>
                        <VibeText variant="bold" style={styles.label}>Language (Optional)</VibeText>
                        <View style={[
                            styles.input,
                            {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                borderColor: isDark ? colors.glass.border : '#ddd',
                                borderRadius: borderRadius.md,
                                flexDirection: 'row',
                                alignItems: 'center'
                            }
                        ]}>
                            <Globe color={currentColors.muted} size={20} style={{ marginRight: 10 }} />
                            <TextInput
                                style={{ flex: 1, color: currentColors.text, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16 }}
                                placeholder="E.g. English, Spanish..."
                                placeholderTextColor={currentColors.muted}
                                value={language}
                                onChangeText={setLanguage}
                            />
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

            {/* Country Picker Modal */}
            <Modal
                visible={isCountryModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsCountryModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: currentColors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]}>
                        <View style={styles.modalHeader}>
                            <VibeText variant="bold" size="lg">Select Country</VibeText>
                            <TouchableOpacity onPress={() => setIsCountryModalVisible(false)} style={styles.closeModalBtn}>
                                <X color={currentColors.text} size={24} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5', borderRadius: borderRadius.md }]}>
                            <Search color={currentColors.muted} size={20} />
                            <TextInput
                                style={[styles.searchInput, { color: currentColors.text }]}
                                placeholder="Search countries..."
                                placeholderTextColor={currentColors.muted}
                                value={countrySearchQuery}
                                onChangeText={setCountrySearchQuery}
                                autoCapitalize="none"
                            />
                            {countrySearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setCountrySearchQuery('')}>
                                    <X color={currentColors.muted} size={16} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={countriesList}
                            keyExtractor={(item) => item.code}
                            contentContainerStyle={styles.countryListParams}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.countryItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}
                                    onPress={() => {
                                        setCountry({ name: item.name, emoji: item.emoji });
                                        setIsCountryModalVisible(false);
                                        setCountrySearchQuery('');
                                    }}
                                >
                                    <VibeText size="xl" style={{ marginRight: 15 }}>{item.emoji}</VibeText>
                                    <VibeText size="md">{item.name}</VibeText>
                                    {country?.name === item.name && (
                                        <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
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
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: height * 0.8,
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    closeModalBtn: {
        padding: 5,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    countryListParams: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    selectedDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 'auto',
    }
});

export default ProfileSetupScreen;
