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
    Flag
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
                            <View style={styles.avatarContainer}>
                                <LinearGradient
                                    colors={[colors.primary, '#ff4fa1']}
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
                            <VibeText color={colors.primary} size="sm" variant="medium">
                                @{persona.nickname?.toLowerCase().replace(/\s/g, '_')}
                            </VibeText>
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

                        {/* Conversation Style */}
                        <View style={styles.section}>
                            <VibeText variant="bold" size="xs" color={currentColors.muted} style={styles.sectionTitle}>
                                CONVERSATION STYLE
                            </VibeText>
                            <View style={styles.styleGrid}>
                                <View style={[styles.styleCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }]}>
                                    <View style={[styles.styleIcon, { backgroundColor: `${colors.primary}20` }]}>
                                        <MessageCircle size={18} color={colors.primary} />
                                    </View>
                                    <View>
                                        <VibeText variant="bold" size="sm">Deep Talker</VibeText>
                                        <VibeText size="xs" color={currentColors.muted}>Loves long convos</VibeText>
                                    </View>
                                </View>
                                <View style={[styles.styleCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }]}>
                                    <View style={[styles.styleIcon, { backgroundColor: `#60a5fa20` }]}>
                                        <Zap size={18} color="#60a5fa" />
                                    </View>
                                    <View>
                                        <VibeText variant="bold" size="sm">Fast Reply</VibeText>
                                        <VibeText size="xs" color={currentColors.muted}>Instant responses</VibeText>
                                    </View>
                                </View>
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
        flexDirection: 'row',
        gap: 12,
    },
    styleCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
        gap: 12,
    },
    styleIcon: {
        padding: 8,
        borderRadius: 12,
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
