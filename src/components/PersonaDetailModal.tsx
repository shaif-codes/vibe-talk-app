import React from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Image,
    ScrollView,
} from 'react-native';
import { useTheme } from '../theme';
import { VibeText } from './VibeText';
import { VibeButton } from './VibeButton';
import {
    Lock,
    MessageSquare,
    Send,
    X,
    MessageCircle,
    Zap,
    Flag,
    User
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const VIBE_MAPPINGS: Record<string, { colors: [string, string], glow: string, descriptors: { high: string, low: string } }> = {
    humor: { 
        colors: ['#4facfe', '#00f2fe'], 
        glow: '#00f2fe',
        descriptors: { high: 'Witty & Playful', low: 'Serious & Direct' }
    },
    flirt: { 
        colors: ['#f5576c', '#fbc2eb'], 
        glow: '#f5576c',
        descriptors: { high: 'Charming & Forward', low: 'Sweet & Reserved' }
    },
    energy: { 
        colors: ['#f6d365', '#fda085'], 
        glow: '#f6d365',
        descriptors: { high: 'Hyper & Intense', low: 'Calm & Chill' }
    },
    empathy: { 
        colors: ['#84fab0', '#8fd3f4'], glow: '#84fab0',
        descriptors: { high: 'Kind & Caring', low: 'Detached & Logical' }
    },
    roast: { 
        colors: ['#a18cd1', '#fbc2eb'], glow: '#a18cd1',
        descriptors: { high: 'Sassy & Savage', low: 'Soft & Forgiving' }
    },
    anger: { 
        colors: ['#ff0844', '#ffb199'], glow: '#ff0844',
        descriptors: { high: 'Fiery & Edgy', low: 'Calm & Mellow' }
    },
};

interface PersonaDetailModalProps {
    visible: boolean;
    persona: any;
    onClose: () => void;
    onChatRequest: (persona: any) => void;
}

export const PersonaDetailModal: React.FC<PersonaDetailModalProps> = ({
    visible,
    persona,
    onClose,
    onChatRequest,
}) => {
    const { colors, currentColors, isDark } = useTheme();
    
    if (!persona) return null;

    // ─── Aura & Trait Logic ──────────────────────────────────────────
    const getAuraConfig = () => {
        if (persona.type === 'user') {
            return {
                colors: ['#FFD700', '#9D50BB'] as [string, string], // Human Gold/Purple
                glow: '#FFD700',
                descriptors: { high: 'Vibrant soul', low: 'Humble soul' }
            };
        }

        const sortedTraits = [...(persona.traits || [])].sort((a, b) => b.score - a.score);
        const top = sortedTraits[0];

        return VIBE_MAPPINGS[top?.name] || { 
            colors: [colors.primary, '#ff4fa1'] as [string, string], 
            glow: colors.primary,
            descriptors: { high: 'Unique Vibe', low: 'Balanced' }
        };
    };

    const aura = getAuraConfig();
    const topTraits = [...(persona.traits || [])]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.backdrop}
                    onPress={onClose}
                />

                <View style={[
                    styles.content,
                    { backgroundColor: currentColors.surface, borderTopColor: 'rgba(255,255,255,0.1)' }
                ]}>
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#ddd' }]} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Profile Header */}
                        <View style={styles.header}>
                            <View style={[styles.avatarContainer, { shadowColor: aura.glow, shadowOpacity: 0.5, shadowRadius: 15 }]}>
                                <LinearGradient
                                    colors={aura.colors as [string, string]}
                                    style={styles.avatarGradient}
                                >
                                    <View style={[styles.avatarBorder, { backgroundColor: currentColors.surface }]}>
                                        <Image
                                            source={{ uri: persona.avatarUrl || 'https://i.pravatar.cc/150' }}
                                            style={styles.avatar}
                                        />
                                    </View>
                                </LinearGradient>
                                <View style={[styles.onlineStatus, { backgroundColor: '#4ade80', borderColor: currentColors.surface }]} />
                            </View>

                            <View style={[styles.badge, { backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}33` }]}>
                                <Lock size={12} color={colors.primary} />
                                <VibeText variant="bold" size="xs" color={colors.primary} style={styles.badgeText}>
                                    Verified • Anonymous Friendly
                                </VibeText>
                            </View>

                            <VibeText variant="display" size="2xl" style={styles.nickname}>
                                {persona.nickname}
                            </VibeText>
                            {persona.username ? (
                                <VibeText color={colors.primary} size="sm" variant="medium">
                                    @{persona.username}
                                </VibeText>
                            ) : (
                                <VibeText color={colors.primary} size="sm" variant="medium">
                                    @{persona.nickname?.toLowerCase().replace(/\s/g, '_')}
                                </VibeText>
                            )}

                            {persona.type === 'user' && (
                                <View style={[styles.badge, { backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}33`, marginTop: 8 }]}>
                                    <User size={12} color={colors.primary} fill={colors.primary} />
                                    <VibeText variant="bold" size="xs" color={colors.primary} style={styles.badgeText}>
                                        Human User
                                    </VibeText>
                                </View>
                            )}
                        </View>

                        {/* Bio */}
                        <View style={styles.bioSection}>
                            <VibeText size="md" style={styles.bioText}>
                                {persona.bio || "No bio available."}
                            </VibeText>
                        </View>

                        {/* Interests */}
                        {persona.interests && persona.interests.length > 0 && (
                            <View style={styles.section}>
                                <VibeText variant="bold" size="xs" color={currentColors.muted} style={styles.sectionTitle}>
                                    INTERESTS
                                </VibeText>
                                <View style={styles.interestsGrid}>
                                    {persona.interests.map((interest: string, index: number) => (
                                        <View
                                            key={index}
                                            style={[styles.interestChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0', borderColor: 'rgba(255,255,255,0.1)' }]}
                                        >
                                            <VibeText size="sm" variant="medium">#{interest}</VibeText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Personality Vibes (Dynamic Traits) */}
                        <View style={styles.section}>
                            <VibeText variant="bold" size="xs" color={currentColors.muted} style={styles.sectionTitle}>
                                PERSONALITY VIBE
                            </VibeText>
                            <View style={styles.styleGrid}>
                                {topTraits.map((trait, index) => (
                                    <View 
                                        key={trait.name} 
                                        style={[
                                            styles.styleCard, 
                                            { 
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0',
                                                borderColor: index === 0 ? `${aura.glow}40` : 'transparent',
                                                borderWidth: index === 0 ? 1 : 0
                                            }
                                        ]}
                                    >
                                        <View style={[styles.styleIcon, { backgroundColor: `${aura.colors[0]}20` }]}>
                                            <VibeText size="lg">{trait.icon || '✨'}</VibeText>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <VibeText variant="bold" size="sm" style={{ marginBottom: 2 }}>{trait.displayName}</VibeText>
                                            <VibeText size="xs" color={currentColors.muted} style={{ marginBottom: 6 }}>
                                                {trait.score > 0.6 
                                                    ? VIBE_MAPPINGS[trait.name]?.descriptors.high 
                                                    : (trait.score < 0.3 ? VIBE_MAPPINGS[trait.name]?.descriptors.low : 'Balanced')}
                                            </VibeText>
                                            <View style={styles.progressBg}>
                                                <View 
                                                    style={[
                                                        styles.progressFill, 
                                                        { 
                                                            width: `${trait.score * 100}%`,
                                                            backgroundColor: index === 0 ? aura.glow : currentColors.muted
                                                        }
                                                    ]} 
                                                />
                                            </View>
                                        </View>
                                        <VibeText variant="bold" size="xs" color={currentColors.muted} style={{ marginLeft: 8 }}>
                                            {Math.round(trait.score * 100)}%
                                        </VibeText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer CTA */}
                    <View style={[styles.footer, { backgroundColor: currentColors.surface }]}>
                        <VibeButton
                            title="Request Chat"
                            onPress={() => onChatRequest(persona)}
                            style={styles.chatBtn}
                        />
                        <TouchableOpacity style={styles.reportBtn}>
                            <VibeText variant="bold" size="xs" color={currentColors.muted} style={{ letterSpacing: 1 }}>
                                REPORT PROFILE
                            </VibeText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    content: {
        maxHeight: SCREEN_HEIGHT * 0.9,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderTopWidth: 1,
        paddingBottom: 20,
    },
    handleContainer: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    handle: {
        width: 48,
        height: 5,
        borderRadius: 3,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginTop: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarGradient: {
        padding: 3,
        borderRadius: 75,
    },
    avatarBorder: {
        borderRadius: 72,
        padding: 4,
    },
    avatar: {
        width: 136,
        height: 136,
        borderRadius: 68,
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 5,
        right: 15,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
    },
    badgeText: {
        marginLeft: 6,
    },
    nickname: {
        textAlign: 'center',
        marginBottom: 4,
    },
    bioSection: {
        marginTop: 24,
        alignItems: 'center',
    },
    bioText: {
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    section: {
        marginTop: 32,
    },
    sectionTitle: {
        letterSpacing: 1.5,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    interestsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    interestChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    styleGrid: {
        marginTop: 4,
    },
    styleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
    },
    styleIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    progressBg: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2,
        marginTop: 6,
        width: '100%',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingTop: 10,
        alignItems: 'center',
    },
    chatBtn: {
        marginBottom: 16,
    },
    reportBtn: {
        paddingVertical: 8,
    }
});
