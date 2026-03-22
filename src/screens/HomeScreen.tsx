import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    RefreshControl,
    TextInput,
    Modal,
    Animated,
    Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { Search, Bell, MessageSquare, Compass, User, X, SlidersHorizontal, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { containerStyles } from '../configs';
import { colors } from '../theme/colors';
import { PersonaDetailModal } from '../components/PersonaDetailModal';
import { VibeLoader } from '../components/VibeLoader';
import { VibeAlert } from '../components/VibeAlert';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import countryData from '../../assets/contryData.json';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;
const NOTIFICATION_PANEL_WIDTH = width * 0.85;

function formatNotificationTime(createdAt: string): string {
    try {
        const date = new Date(createdAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        if (diffMs < 60 * 1000) return 'JUST NOW';
        const mins = Math.floor(diffMs / (60 * 1000));
        if (mins < 60) return `${mins}M AGO`;
        const hours = Math.floor(diffMs / (60 * 60 * 1000));
        if (hours < 24) return `${hours}H AGO`;
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        return `${days}D AGO`;
    } catch {
        return '';
    }
}

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

type NotificationItem = {
    notificationId: string;
    type: string;
    payload: { sessionId?: string; message?: string; senderName?: string; senderAvatar?: string; personaId?: string; [k: string]: any };
    createdAt: string;
    status: string;
};

function NotificationCard({
    item,
    isDark,
    colors,
    currentColors,
    formatTime,
    onPress
}: {
    item: NotificationItem;
    isDark: boolean;
    colors: typeof import('../theme/colors').colors;
    currentColors: Record<string, string>;
    formatTime: (createdAt: string) => string;
    onPress: () => void;
}) {
    const isUnread = item.status !== 'read';
    const avatarUri = item.payload?.senderAvatar || 'https://via.placeholder.com/64';
    const senderName = item.payload?.senderName ?? 'Someone';
    const message = item.payload?.message ?? 'You have a new notification.';
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.95}
            style={[
                styles.notificationCard,
                {
                    backgroundColor: isUnread
                        ? (isDark ? 'rgba(238,43,140,0.1)' : 'rgba(238,43,140,0.08)')
                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    borderColor: isUnread ? `${colors.primary}4D` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)')
                }
            ]}
        >
            <View style={styles.notificationCardInner}>
                <View style={styles.notificationCardAvatarWrap}>
                    <Image source={{ uri: avatarUri }} style={[styles.notificationCardAvatar, isUnread && { borderColor: colors.primary, borderWidth: 2 }]} />
                    {isUnread && <View style={[styles.notificationCardUnreadDot, { backgroundColor: colors.primary }]} />}
                </View>
                <View style={styles.notificationCardBody}>
                    <View style={styles.notificationCardRow}>
                        <VibeText variant="bold" size="md" numberOfLines={1} style={{ flex: 1 }} color={isUnread ? currentColors.text : currentColors.muted}>
                            {senderName}
                        </VibeText>
                        <VibeText size="xs" variant="bold" color={isUnread ? colors.primary : currentColors.muted}>
                            {formatTime(item.createdAt)}
                        </VibeText>
                    </View>
                    <VibeText size="sm" color={currentColors.muted} numberOfLines={2} style={{ fontStyle: 'italic' }}>
                        {message}
                    </VibeText>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const HomeScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const { colors, currentColors, isDark } = useTheme();
    const { notifications, unreadCount, markNotificationAsRead, markAllAsRead } = useNotifications();

    const [personas, setPersonas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMood, setActiveMood] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState<'all' | 'vibes'>('all');
    const [alertConfig, setAlertConfig] = useState({ title: '', description: '', type: 'error' as any });
    const notificationSlideAnim = useRef(new Animated.Value(NOTIFICATION_PANEL_WIDTH)).current;

    useEffect(() => {
        fetchPersonas();
    }, [activeMood]);

    useEffect(() => {
        if (isNotificationsVisible) {
            Animated.spring(notificationSlideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11
            }).start();
        } else {
            Animated.timing(notificationSlideAnim, {
                toValue: NOTIFICATION_PANEL_WIDTH,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [isNotificationsVisible]);

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
                    <VibeText size="xs">
                        {(() => {
                            if (!item.country) return '';
                            // Try mapping string to emoji
                            const countryKey = Object.keys(countryData).find(key => (countryData as any)[key].name === item.country);
                            if (countryKey) {
                                return `${(countryData as any)[countryKey].emoji} ${item.country}`;
                            }
                            return item.country;
                        })()}
                    </VibeText>
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
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f5f5f5' }]}
                            onPress={() => setIsNotificationsVisible(true)}
                        >
                            <Bell size={20} color={currentColors.text} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <VibeText size="xs" color="white" variant="bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </VibeText>
                                </View>
                            )}
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
                    <View style={styles.navItemIconWrap}>
                        <MessageSquare size={24} color={currentColors.muted} />
                        {unreadCount > 0 && (
                            <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]}>
                                <VibeText size="xs" color="white" variant="bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </VibeText>
                            </View>
                        )}
                    </View>
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

            <Modal
                visible={isNotificationsVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsNotificationsVisible(false)}
            >
                <View style={styles.notificationOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsNotificationsVisible(false)} />
                    <Animated.View
                        style={[
                            styles.notificationPanel,
                            {
                                width: NOTIFICATION_PANEL_WIDTH,
                                backgroundColor: isDark ? 'rgba(10,10,10,0.98)' : currentColors.surface,
                                borderLeftColor: isDark ? `${colors.primary}4D` : `${colors.primary}30`
                            },
                            { transform: [{ translateX: notificationSlideAnim }] }
                        ]}
                    >
                        <View style={[styles.notificationPanelHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
                            <View style={styles.notificationPanelTitleRow}>
                                <Bell size={28} color={colors.primary} />
                                <VibeText variant="bold" size="xl">Notifications</VibeText>
                            </View>
                            <TouchableOpacity
                                onPress={() => setIsNotificationsVisible(false)}
                                style={[styles.notificationCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                            >
                                <X size={22} color={currentColors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.notificationPanelScroll}
                            contentContainerStyle={styles.notificationPanelScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={[styles.notificationPillsRow, { backgroundColor: isDark ? 'rgba(10,10,10,0.95)' : currentColors.surface }]}>
                                <TouchableOpacity
                                    onPress={() => setNotificationFilter('all')}
                                    style={[
                                        styles.notificationPill,
                                        notificationFilter === 'all' && { backgroundColor: colors.primary }
                                    ]}
                                >
                                    <VibeText size="sm" variant="bold" color={notificationFilter === 'all' ? 'white' : currentColors.muted}>All</VibeText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setNotificationFilter('vibes')}
                                    style={[
                                        styles.notificationPill,
                                        styles.notificationPillInactive,
                                        { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                                        notificationFilter === 'vibes' && { backgroundColor: colors.primary, borderColor: 'transparent' }
                                    ]}
                                >
                                    <VibeText size="sm" variant="bold" color={notificationFilter === 'vibes' ? 'white' : currentColors.muted}>Vibes</VibeText>
                                </TouchableOpacity>
                            </View>

                            {(() => {
                                const filtered = notificationFilter === 'vibes'
                                    ? notifications.filter((n) => n.type === 'message')
                                    : notifications;
                                const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
                                const newest = filtered.filter((n) => n.status !== 'read' || new Date(n.createdAt).getTime() > twoHoursAgo);
                                const earlier = filtered.filter((n) => n.status === 'read' && new Date(n.createdAt).getTime() <= twoHoursAgo);

                                if (filtered.length === 0) {
                                    return (
                                        <View style={styles.notificationEmptyState}>
                                            <View style={[styles.notificationEmptyIconWrap, { borderColor: `${colors.primary}20`, backgroundColor: `${colors.primary}0D` }]}>
                                                <Sparkles size={40} color={`${colors.primary}66`} />
                                            </View>
                                            <VibeText color={currentColors.muted} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                                                All caught up!
                                            </VibeText>
                                            <VibeText size="sm" variant="bold" color={colors.primary} style={{ marginTop: 8, letterSpacing: 1 }}>
                                                Time to discover some new vibes.
                                            </VibeText>
                                        </View>
                                    );
                                }

                                return (
                                    <>
                                        {newest.length > 0 && (
                                            <>
                                                <VibeText size="xs" variant="bold" color={colors.primary} style={styles.notificationSectionLabel}>
                                                    NEWEST VIBES
                                                </VibeText>
                                                {newest.map((item) => (
                                                    <NotificationCard
                                                        key={item.notificationId}
                                                        item={item}
                                                        isDark={isDark}
                                                        colors={colors}
                                                        currentColors={currentColors}
                                                        formatTime={formatNotificationTime}
                                                        onPress={() => {
                                                            markNotificationAsRead(item.notificationId);
                                                            setIsNotificationsVisible(false);
                                                            const p = item.payload;
                                                            if (p?.sessionId) {
                                                                const persona = (p.personaId && (p.senderName != null || p.senderAvatar != null))
                                                                    ? { id: p.personaId, nickname: p.senderName ?? 'Someone', avatarUrl: p.senderAvatar }
                                                                    : null;
                                                                navigation.navigate('Chat', { sessionId: p.sessionId, persona: persona ?? undefined });
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </>
                                        )}
                                        {earlier.length > 0 && (
                                            <>
                                                <VibeText size="xs" variant="bold" color={currentColors.muted} style={[styles.notificationSectionLabel, { marginTop: newest.length > 0 ? 24 : 0 }]}>
                                                    EARLIER TODAY
                                                </VibeText>
                                                {earlier.map((item) => (
                                                    <NotificationCard
                                                        key={item.notificationId}
                                                        item={item}
                                                        isDark={isDark}
                                                        colors={colors}
                                                        currentColors={currentColors}
                                                        formatTime={formatNotificationTime}
                                                        onPress={() => {
                                                            markNotificationAsRead(item.notificationId);
                                                            setIsNotificationsVisible(false);
                                                            const p = item.payload;
                                                            if (p?.sessionId) {
                                                                const persona = (p.personaId && (p.senderName != null || p.senderAvatar != null))
                                                                    ? { id: p.personaId, nickname: p.senderName ?? 'Someone', avatarUrl: p.senderAvatar }
                                                                    : null;
                                                                navigation.navigate('Chat', { sessionId: p.sessionId, persona: persona ?? undefined });
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </ScrollView>

                        <View style={[styles.notificationPanelFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
                            <TouchableOpacity
                                onPress={() => { markAllAsRead(); setIsNotificationsVisible(false); }}
                                style={[styles.notificationMarkAllBtn, { borderColor: `${colors.primary}66` }]}
                                activeOpacity={0.85}
                            >
                                <VibeText variant="bold" color={colors.primary}>MARK ALL AS READ</VibeText>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

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
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.accent.red,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
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
    navItemIconWrap: {
        position: 'relative',
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
    },
    notificationOverlay: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    notificationPanel: {
        flex: 1,
        borderLeftWidth: 1,
        maxWidth: NOTIFICATION_PANEL_WIDTH,
    },
    notificationPanelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    notificationPanelTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationPanelScroll: {
        flex: 1,
    },
    notificationPanelScrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    notificationPillsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 16,
        paddingRight: 8,
        marginBottom: 8,
    },
    notificationPill: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 9999,
    },
    notificationPillInactive: {
        borderWidth: 1,
    },
    notificationSectionLabel: {
        letterSpacing: 2,
        marginBottom: 12,
        paddingLeft: 8,
    },
    notificationEmptyState: {
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    notificationEmptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    notificationCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 16,
    },
    notificationCardInner: {
        flexDirection: 'row',
        gap: 20,
    },
    notificationCardAvatarWrap: {
        position: 'relative',
    },
    notificationCardAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    notificationCardUnreadDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.95)',
    },
    notificationCardBody: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    notificationCardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 4,
        gap: 8,
    },
    notificationPanelFooter: {
        padding: 24,
        borderTopWidth: 1,
    },
    notificationMarkAllBtn: {
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    noNotificationState: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    notificationItem: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        gap: 4,
    },
    closeNotificationBtn: {
        marginTop: 6,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center'
    }
});

export default HomeScreen;
