import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    RefreshControl,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { Search, Bell, MessageSquare, Compass, User, X, SlidersHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { containerStyles } from '../configs';
import { colors } from '../theme/colors';
import { PersonaDetailModal } from '../components/PersonaDetailModal';
import { VibeLoader } from '../components/VibeLoader';
import { VibeAlert } from '../components/VibeAlert';
import api from '../services/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const MOODS = [
    { id: '1', label: 'All Moods', mood: '' },
    { id: '2', label: 'Chill', emoji: '😊', mood: 'Chill' },
    { id: '3', label: 'Gaming', emoji: '🎮', mood: 'Gaming' },
    { id: '4', label: 'Music', emoji: '🎵', mood: 'Music' },
    { id: '5', label: 'Deep', emoji: '💭', mood: 'Deep' },
];

const MOCK_PERSONAS = [
    {
        id: '1',
        name: 'StarGazer',
        bio: 'Listening to Lofi',
        mood: 'Chill',
        moodEmoji: '😊',
        country: '🇺🇸',
        online: true,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUdiqSKKBhbhJxi8Wa12JO-lLF8t7PefyOk4iJiA6g5zj2aFpcUiL8EDofkwfGdEuu41QuUb9hf2BOW4hn0H3qTU8LjK6n4NeZRWSqPGJINF_guiyXzZ5qSrsdpQ1_dTo-K9QdOdxidSA1TVYVq2qmLPDyhZX1_KfoF-k8vibSxRYf73KHHpnbI6IHKVZZYFaujInc6yJYtsE2w25v-2m_nSWnnLFtYuH28U7UFjDaC0KA5ArcE7xfVUfpl12ihxqXTNEMsR_BRds'
    },
    {
        id: '2',
        name: 'Cloud9',
        bio: 'Looking for a friend',
        mood: 'Need talk',
        moodEmoji: '😔',
        country: '🇬🇧',
        online: true,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ6a8liGkrPlKi8MTTRoKDaHOp2K0a3FkUFiqi4Js22bdzQB9-2D6nt-AZTtpHGtQIgFAGp3t2DwRCVN-dseJwBwj9A3CpDHlJXqu50Dck405eL0kBY1E2CbRxNVzEx0GDAZXY8m_juuMMN3Dqtvp7HRq_hRzSRYhFQh-kTBazubNMuW2u6b424PtBY6sW_TF-1SEoH8_o_XvUPFCcEbNW80gdzjLnlrfOtDYykFG8_g1ENXJYj872EtnYD2vOWnDF_7zlSKfU-xc'
    },
    {
        id: '3',
        name: 'PixelPulse',
        bio: 'Playing Valorant',
        mood: 'Gaming',
        moodEmoji: '🎮',
        country: '🇨🇦',
        online: true,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCX4vB-NmGtEqhPLbR1Cz-aiZMemGO-JHl6dFu0bMPY9oHtZW3Bu2m3j7xGhEETueZY3GzYm6trqe7iKBToqUMb1RgWOCk8c3d_herxGACWZWx8YBigtWyS5uU-2nKExdRDeHOE8coIPBOy-1yoaCmOW2tduuiwpcIjgU6Mc41rkFQpmEl-WSS5tI-4G4_SSYWlAJJGfqhc1k8BsuBTt7AQQw37Wo7aviDFNjyDzXw6wyXMC0Jn1a9VWVytXKXtMHRk10eX1asxnD4'
    },
    {
        id: '4',
        name: 'MoonLight',
        bio: 'New tracks only',
        mood: 'Music',
        moodEmoji: '🎵',
        country: '🇦🇺',
        online: true,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgM6bT0lFAlcHBheOlu40lw1Y1biaaw-XuT8F3Vp8GXuJH9tWpwf8t9KEWWildV8FVmlcnZa5h4BHyrkOwhLGipOmWkk6e5PPf8SgtzhqqDSMk0DTIfqaIPHpOreSi1nnmqYQePFQ5MjC-KsZnfY2hOqyZMZQ2sFnr62SbK-KxjCwKAAVNfrOuNVYmohNzvk9thhnBwJGe8S6TElIUJdQ3aC-ir5KPwEYeQ7nCn_oz-O4_fD4JD_38WlrqofzmOcTAIXznW-MQJI8'
    }
];

const HomeScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const { colors, currentColors, isDark } = useTheme();

    const [personas, setPersonas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMood, setActiveMood] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', description: '', type: 'error' as any });

    useEffect(() => {
        fetchPersonas();
    }, [activeMood]);

    const fetchPersonas = async (query?: string) => {
        try {
            setLoading(true); // Always show loader on fetch for search/mood feedback


            const params: any = {};
            if (activeMood) params.mood = activeMood;
            if (query) params.search = query;

            const response = await api.get('/personas', { params });
            setPersonas(response.data.personas || []);
        } catch (error) {
            console.error('Failed to fetch personas:', error);
            // Don't show alert if it's just a blank search result
            if (personas.length === 0) {
                setAlertConfig({
                    title: 'Oops!',
                    description: 'Failed to load vibes. Please try again.',
                    type: 'error'
                });
                setIsAlertVisible(true);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Simple manual search trigger or we could use debouncing
    const handleSearch = () => {
        fetchPersonas(searchQuery);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setLoading(true);
        fetchPersonas('');
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPersonas();
    };

    const renderPersona = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: currentColors.surface }]}
            onPress={() => {
                setSelectedPersona(item);
                setIsModalVisible(true);
            }}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                <View style={styles.statusBadge}>
                    <View style={styles.onlineDot} />
                    <VibeText size="xs" color="white" variant="bold">ONLINE</VibeText>
                </View>
                <View style={styles.moodBadge}>
                    <VibeText size="xs" color="white" variant="bold">
                        {item.moodEmoji || '✨'} {item.mood}
                    </VibeText>
                </View>
            </View>
            <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                    <VibeText variant="bold" style={styles.name}>{item.nickname}</VibeText>
                    <VibeText size="xs">{item.country}</VibeText>
                </View>
                <VibeText size="xs" color={currentColors.muted} numberOfLines={1}>{item.bio}</VibeText>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <VibeText variant="bold" size="2xl">Discover</VibeText>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f5f5f5' }]}>
                            <Bell size={20} color={currentColors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee'
                }]}>
                    <Search size={18} color={currentColors.muted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: currentColors.text }]}
                        placeholder="Search by name, bio or interests..."
                        placeholderTextColor={currentColors.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <X size={18} color={currentColors.muted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Mood Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
                    {MOODS.map(mood => {
                        const isActive = activeMood === mood.mood;
                        return (
                            <TouchableOpacity
                                key={mood.id}
                                onPress={() => setActiveMood(mood.mood)}
                                style={[
                                    styles.filterItem,
                                    { backgroundColor: isActive ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : '#f5f5f5') }
                                ]}
                            >
                                <VibeText
                                    variant="semiBold"
                                    size="sm"
                                    color={isActive ? 'white' : (isDark ? '#ccc' : '#666')}
                                >
                                    {mood.emoji} {mood.label}
                                </VibeText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Grid */}
            {loading ? (
                <VibeLoader advanced size={60} />
            ) : (
                <FlatList
                    data={personas}
                    renderItem={renderPersona}
                    keyExtractor={item => item.id || item._id}
                    numColumns={2}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9' }]}>
                                <Compass size={48} color={currentColors.muted} />
                            </View>
                            <VibeText variant="bold" size="lg" style={{ marginBottom: 8 }}>No vibes found</VibeText>
                            <VibeText color={currentColors.muted} style={{ textAlign: 'center', paddingHorizontal: 40 }}>
                                {searchQuery || activeMood
                                    ? "Try adjusting your search or filters to find more interesting people."
                                    : "We couldn't find any personas. Check back later!"}
                            </VibeText>
                            {(searchQuery || activeMood) && (
                                <TouchableOpacity
                                    style={styles.resetBtn}
                                    onPress={() => {
                                        setSearchQuery('');
                                        setActiveMood('');
                                        fetchPersonas('');
                                    }}
                                >
                                    <VibeText color={colors.primary} variant="bold">Clear all filters</VibeText>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}

            {/* Floating Button */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.9}
                onPress={() => {
                    if (personas.length > 0) {
                        const randomPersona = personas[Math.floor(Math.random() * personas.length)];
                        navigation.navigate('Chat', { persona: randomPersona });
                    }
                }}
            >
                <LinearGradient
                    colors={[colors.primary, '#ff4fa1']}
                    style={styles.fabGradient}
                >
                    <MessageSquare size={24} color="white" />
                    <VibeText variant="bold" size="md" color="white" style={{ marginLeft: 10 }}>
                        Start Random Chat
                    </VibeText>
                </LinearGradient>
            </TouchableOpacity>

            {/* Bottom Nav */}
            <View style={[styles.bottomNav, {
                backgroundColor: isDark ? 'rgba(26, 12, 19, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee'
            }]}>
                <TouchableOpacity style={styles.navItem}>
                    <Compass size={24} color={colors.primary} />
                    <VibeText size="xs" color={colors.primary} variant="bold" style={styles.navLabel}>DISCOVER</VibeText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Sessions')}
                >
                    <MessageSquare size={24} color={currentColors.muted} />
                    <VibeText size="xs" color={currentColors.muted} variant="bold" style={styles.navLabel}>CHATS</VibeText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                    <User size={24} color={currentColors.muted} />
                    <VibeText size="xs" color={currentColors.muted} variant="bold" style={styles.navLabel}>PROFILE</VibeText>
                </TouchableOpacity>
            </View>

            <PersonaDetailModal
                visible={isModalVisible}
                persona={selectedPersona}
                onClose={() => setIsModalVisible(false)}
                onChatRequest={(persona) => {
                    setIsModalVisible(false);
                    navigation.navigate('Chat', { persona });
                }}
            />

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
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 24,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_500Medium',
        paddingVertical: 8,
    },
    filterBar: {
        flexDirection: 'row',
        paddingBottom: 15,
    },
    filterItem: {
        paddingHorizontal: 16,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    gridContent: {
        paddingHorizontal: 16,
        paddingBottom: 180,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    card: {
        width: COLUMN_WIDTH,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 0.8,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80',
        marginRight: 4,
    },
    moodBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    cardInfo: {
        padding: 12,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        height: 60,
        borderRadius: 30,
        zIndex: 10,
        shadowColor: '#ee2b8c',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    fabGradient: {
        flex: 1,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 84,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        paddingHorizontal: 20,
        borderTopWidth: 1,
    },
    navItem: {
        alignItems: 'center',
    },
    navLabel: {
        marginTop: 4,
        letterSpacing: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    resetBtn: {
        marginTop: 16,
        padding: 12,
    }
});

export default HomeScreen;
