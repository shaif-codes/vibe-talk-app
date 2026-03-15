import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { VibeLoader } from '../components/VibeLoader';
import {
    ChevronLeft,
    MessageSquare,
    Clock,
    ChevronRight,
    Search,
    Compass,
    User
} from 'lucide-react-native';
import { containerStyles } from '../configs';
import chatService, { ChatSession } from '../services/chat.service';
import { formatDistanceToNow } from 'date-fns';
import { VibeAlert } from '../components/VibeAlert';

const SessionsScreen = ({ navigation }: any) => {
    const { colors, currentColors, isDark } = useTheme();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', description: '', type: 'error' as any });

    const fetchSessions = async () => {
        try {
            const data = await chatService.getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            setAlertConfig({
                title: 'Sync Error',
                description: 'Failed to load your chat sessions. Please check your connection.',
                type: 'error'
            });
            setIsAlertVisible(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSessions();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderSessionItem = ({ item }: { item: any }) => {
        const isActive = item.status === 'active';
        const persona = item.persona;
        const timeAgo = item.startTime ? formatDistanceToNow(new Date(item.startTime), { addSuffix: true }) : '';

        return (
            <TouchableOpacity
                style={[styles.sessionCard, { backgroundColor: currentColors.surface, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}
                onPress={() => navigation.navigate('Chat', { persona: item.persona, sessionId: item.id })}
                activeOpacity={0.8}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: persona?.avatarUrl || 'https://i.pravatar.cc/150' }}
                        style={styles.avatar}
                    />
                    {isActive && <View style={[styles.activeDot, { backgroundColor: colors.accent.green || '#4ade80', borderColor: currentColors.surface }]} />}
                </View>

                <View style={styles.sessionInfo}>
                    <View style={styles.sessionHeader}>
                        <VibeText variant="bold" size="md">{persona?.nickname || 'Stranger'}</VibeText>
                        <VibeText size="xs" color={currentColors.muted}>{timeAgo}</VibeText>
                    </View>

                    <View style={styles.sessionFooter}>
                        {isActive ? (
                            <View style={[styles.statusBadge, { backgroundColor: `${colors.primary}1A` }]}>
                                <Clock size={12} color={colors.primary} />
                                <VibeText variant="bold" size="xs" color={colors.primary} style={styles.statusText}>
                                    {formatTime(item.remainingSeconds)} LEFT
                                </VibeText>
                            </View>
                        ) : (
                            <VibeText size="xs" color={currentColors.muted}>Session {item.status}</VibeText>
                        )}
                        <ChevronRight size={16} color={currentColors.muted} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}>
                        <ChevronLeft size={20} color={currentColors.text} />
                    </TouchableOpacity>
                    <VibeText variant="bold" size="lg">Your Vibes</VibeText>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}>
                        <Search size={20} color={currentColors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <VibeLoader advanced size={60} />
            ) : sessions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}1A` }]}>
                        <MessageSquare size={48} color={colors.primary} />
                    </View>
                    <VibeText variant="display" size="lg" style={styles.emptyTitle}>No Vibes Yet</VibeText>
                    <VibeText color={currentColors.muted} style={styles.emptySubtitle}>Start a chat to see your conversations here.</VibeText>
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    renderItem={renderSessionItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                />
            )}

            {/* Bottom Nav */}
            <View style={[styles.bottomNav, {
                backgroundColor: isDark ? 'rgba(26, 12, 19, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee'
            }]}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
                    <Compass size={24} color={currentColors.muted} />
                    <VibeText size="xs" color={currentColors.muted} variant="bold" style={styles.navLabel}>DISCOVER</VibeText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MessageSquare size={24} color={colors.primary} />
                    <VibeText size="xs" color={colors.primary} variant="bold" style={styles.navLabel}>CHATS</VibeText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                    <User size={24} color={currentColors.muted} />
                    <VibeText size="xs" color={currentColors.muted} variant="bold" style={styles.navLabel}>PROFILE</VibeText>
                </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    activeDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },
    sessionInfo: {
        flex: 1,
        marginLeft: 16,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    sessionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        marginLeft: 4,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        textAlign: 'center',
        lineHeight: 22,
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
    }
});

export default SessionsScreen;
