import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    // SafeAreaView is deprecated in RN Core
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    Dimensions,
    Animated,
    Easing,
    AppState,
    AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import {
    ChevronLeft,
    Flag,
    Clock,
    Smile,
    Mic,
    Send,
    ShieldCheck,
    Check,
    CheckCheck,
} from 'lucide-react-native';
import { containerStyles } from '../configs';
import { colors } from '../theme/colors';
import { chatService, Message, ChatSession, SessionDetails } from '../services/chat.service';
import socketService from '../services/socket';
import { VibeLoader } from '../components/VibeLoader';
import { VibeAlert } from '../components/VibeAlert';
import { PlusCircle } from 'lucide-react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNotifications } from '../context/NotificationContext';

const { width } = Dimensions.get('window');

const ICEBREAKERS = [
    "What made you smile today?",
    "Current obsession?",
    "Red flags? 🚩",
    "Favorite childhood memory?"
];

const ChatScreen = ({ navigation, route }: any) => {
    const { persona: paramPersona, sessionId: paramSessionId } = route.params || {};
    const { user, updateUserData } = useAuth();
    const { colors, currentColors, isDark } = useTheme();
    const { markNotificationsAsReadBySessionId } = useNotifications();
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [session, setSession] = useState<ChatSession | null>(null);
    /** Persona from session when opened by sessionId; otherwise use param persona */
    const [displayPersona, setDisplayPersona] = useState<{ id?: string; _id?: string; nickname?: string; avatarUrl?: string } | null>(paramPersona ?? null);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<any>({ title: '', description: '', type: 'info' });
    const headerHeight = useHeaderHeight();

    // Animation for timer
    const timerScale = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

    const flatListRef = useRef<FlatList>(null);
    const activeSessionIdRef = useRef<string | null>(null);

    useEffect(() => {
        initChat();

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && activeSessionIdRef.current) {
                console.log('[ChatScreen] App returned to foreground, re-joining session...');
                socketService.emit('join-session', { sessionId: activeSessionIdRef.current });
                refreshHistory();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
            if (pulseAnim.current) pulseAnim.current.stop();
            if (activeSessionIdRef.current) {
                socketService.emit('leave-session', { sessionId: activeSessionIdRef.current });
                activeSessionIdRef.current = null;
            }
            socketService.off('message-sent');
            socketService.off('persona-response');
            socketService.off('typing');
            socketService.off('timer-update');
            socketService.off('session-expired');
            socketService.off('error');
        };
    }, [paramSessionId]);

    const refreshHistory = async () => {
        if (!activeSessionIdRef.current) return;
        try {
            const messages = await chatService.getMessages(activeSessionIdRef.current);
            setHistory(messages.map(m => ({
                id: m.id,
                text: m.content,
                sender: m.sender,
                status: 'delivered',
                time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
        } catch (error) {
            console.error('Error refreshing history:', error);
        }
    };

    const initChat = async () => {
        try {
            setLoading(true);

            let activeSession: ChatSession;
            if (paramSessionId) {
                const details: SessionDetails = await chatService.getSession(paramSessionId);
                activeSession = details;
                setSession(details);
                setRemainingTime(details.remainingSeconds ?? 0);
                if (details.persona) {
                    setDisplayPersona({
                        id: details.persona.id ?? details.persona._id,
                        _id: details.persona._id ?? details.persona.id,
                        nickname: details.persona.nickname,
                        avatarUrl: details.persona.avatarUrl
                    });
                }
            } else {
                const persona = paramPersona;
                if (!persona?.id && !persona?._id) {
                    setLoading(false);
                    return;
                }
                activeSession = await chatService.startSession(persona.id || persona._id);
                setSession(activeSession);
                setRemainingTime(activeSession.remainingSeconds);
                setDisplayPersona(persona);
            }

            // 2. Join active session on already-connected app-level socket
            socketService.emit('join-session', { sessionId: activeSession.id });
            activeSessionIdRef.current = activeSession.id;

            // Mark all notifications for this session as read (user is viewing the chat)
            markNotificationsAsReadBySessionId(activeSession.id);

            // 3. Load history
            const messages = await chatService.getMessages(activeSession.id);
            setHistory(messages.map(m => ({
                id: m.id,
                text: m.content,
                sender: m.sender,
                status: 'delivered',
                time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));

            // 4. Setup listeners
            socketService.on('message-sent', (data) => {
                setHistory(prev => {
                    // Try to find the optimistic message by clientMsgId
                    const existingIdx = prev.findIndex(m => m.id === data.clientMsgId);

                    if (existingIdx !== -1) {
                        const newHistory = [...prev];
                        newHistory[existingIdx] = {
                            ...newHistory[existingIdx],
                            id: data.id, // Update to real DB ID
                            status: 'delivered',
                            time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        return newHistory;
                    }

                    // Fallback (e.g. if message was sent from another device/reloaded)
                    return [...prev, {
                        id: data.id,
                        text: data.content,
                        sender: 'user',
                        status: 'delivered',
                        time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }];
                });
            });

            socketService.on('persona-response', (data) => {
                setHistory(prev => [...prev, {
                    id: data.id,
                    text: data.content,
                    sender: 'persona',
                    time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            });

            socketService.on('typing', (data) => {
                setIsTyping(data.isTyping);
            });

            socketService.on('timer-update', (data) => {
                console.log('Timer update:', data.remainingSeconds);
                setRemainingTime(data.remainingSeconds);
            });

            socketService.on('session-expired', (data) => {
                setRemainingTime(0);
                setAlertConfig({
                    title: 'Time Up!',
                    description: data.message || 'Your free vibes are over. Ready for more?',
                    type: 'error',
                    buttonText: 'Extend (25 Coins)',
                });
                setIsAlertVisible(true);
            });

            socketService.on('error', (data) => {
                console.error('Socket Error:', data.message);
                // Handle delivery failure
                if (data.message === 'Failed to send message') {
                    setHistory(prev => prev.map(m => m.status === 'sending' ? { ...m, status: 'error' } : m));
                }
            });

        } catch (error) {
            console.error('Chat Init Error:', error);
            setAlertConfig({
                title: 'Connection Failed',
                description: 'Failed to initialize chat session. Please try again.',
                type: 'error',
                buttonText: 'Try Again'
            });
            setIsAlertVisible(true);
        } finally {
            setLoading(false);
        }
    };

    // Timer Animation Trigger
    useEffect(() => {
        console.log('Remaining time:', remainingTime);
        if (remainingTime <= 15 && remainingTime > 0) {
            // Adjust pulse speed based on urgency
            const duration = remainingTime <= 5 ? 250 : 400;

            // Stop current animation to restart with new speed if needed
            if (pulseAnim.current) {
                pulseAnim.current.stop();
                pulseAnim.current = null;
            }

            if (!pulseAnim.current) {
                pulseAnim.current = Animated.loop(
                    Animated.sequence([
                        Animated.timing(timerScale, {
                            toValue: 1.15,
                            duration: duration,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(timerScale, {
                            toValue: 1,
                            duration: duration,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ])
                );
                pulseAnim.current.start();
            }
        } else {
            // Stop pulsing
            if (pulseAnim.current) {
                pulseAnim.current.stop();
                pulseAnim.current = null;
                Animated.timing(timerScale, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
        }
    }, [remainingTime]);

    const sendMessage = () => {
        const text = message.trim();
        if (!text || !session) return;

        // Optimistic update
        const clientMsgId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newMsg = {
            id: clientMsgId,
            text: text,
            sender: 'user',
            status: 'sending',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setHistory(prev => [...prev, newMsg]);
        setMessage('');

        socketService.emit('send-message', {
            sessionId: session.id,
            message: text,
            clientMsgId: clientMsgId
        });

        // Clear typing status immediately on send
        if ((global as any).typingTimeout) clearTimeout((global as any).typingTimeout);
        socketService.emit('typing', { sessionId: session.id, isTyping: false });
    };

    const leaveChat = async () => {
        if (session) {
            try {
                await chatService.endSession(session.id);
            } catch (error) {
                console.error('Error ending session:', error);
            }
        }
        navigation.goBack();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderMessage = ({ item }: any) => {
        const isUser = item.sender === 'user';

        return (
            <View style={[styles.msgWrapper, isUser ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                <View style={[
                    styles.msgBubble,
                    isUser ? [styles.userBubble, { borderColor: `${colors.primary}66` }] : [styles.aiBubble, { backgroundColor: isDark ? '#2a1520' : '#f0f0f0' }]
                ]}>
                    <VibeText size="md" color={isUser ? 'white' : (isDark ? '#e2e8f0' : '#333')}>
                        {item.text}
                    </VibeText>
                </View>
                <View style={styles.msgMeta}>
                    <VibeText size="xs" color={currentColors.muted}>{item.time}</VibeText>
                    {isUser && (
                        <View style={{ marginLeft: 4 }}>
                            {item.status === 'sending' ? (
                                <Check size={12} color={currentColors.muted} />
                            ) : item.status === 'error' ? (
                                <VibeText size="xs" color={colors.accent.red}>Failed</VibeText>
                            ) : (
                                <CheckCheck size={12} color={colors.primary} />
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };


    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: currentColors.background }}>
                <VibeLoader advanced size={80} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: `${colors.primary}1A` }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}>
                        <ChevronLeft size={20} color={currentColors.text} />
                    </TouchableOpacity>

                    <View style={{ alignItems: 'center' }}>
                        <View style={styles.nameRow}>
                            <VibeText variant="bold" size="sm">{displayPersona?.nickname || 'Stranger'}</VibeText>
                        </View>
                        <VibeText size="xs" color={colors.primary} variant="semiBold" style={{ letterSpacing: 1 }}>
                            <ShieldCheck size={12} color={colors.primary} /> END-TO-END ENCRYPTED
                        </VibeText>
                    </View>

                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}>
                        <Flag size={20} color={currentColors.text} />
                    </TouchableOpacity>
                </View>

                {/* Timer */}
                <View style={styles.timerContainer}>
                    <Animated.View style={[
                        styles.timerBadge,
                        {
                            backgroundColor: remainingTime > 15 ? colors.primary : (remainingTime > 0 ? colors.accent.red : colors.accent.red),
                            transform: [{ scale: timerScale }]
                        }
                    ]}>
                        <Clock size={14} color="white" />
                        <VibeText variant="bold" size="xs" color="white" style={{ marginLeft: 6 }}>
                            {remainingTime > 0 ? formatTime(remainingTime) : '00:00'} LEFT
                        </VibeText>
                        {remainingTime === 0 && (
                            <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => {
                                setAlertConfig({
                                    title: 'Time Up!',
                                    description: 'Your free vibes are over. Ready for more?',
                                    type: 'error',
                                    buttonText: 'Extend (25 Coins)',
                                });
                                setIsAlertVisible(true);
                            }}>
                                <PlusCircle size={14} color="white" />
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </View>
            </View>

            {/* Content */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={history}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatList}
                    ListHeaderComponent={() => (
                        <View style={styles.notice}>
                            <VibeText size="xs" color={`${colors.primary}80`} variant="medium">
                                Connection established. Vibe away!
                            </VibeText>
                        </View>
                    )}
                    // Removed forced scrolling on content size change to avoid jumping
                    ListFooterComponent={() => isTyping ? (
                        <View style={[styles.msgWrapper, { alignItems: 'flex-start' }]}>
                            <VibeText size="xs" color={currentColors.muted}>{displayPersona?.nickname} is typing...</VibeText>
                        </View>
                    ) : null}
                />

                {/* Footer / Input Area */}
                <View style={styles.footer}>
                    {!history.some(m => m.sender === 'user') && (
                        <>
                            <VibeText variant="bold" size="xs" color={currentColors.muted} style={styles.icebreakerTitle}>
                                BREAK THE ICE
                            </VibeText>
                            <FlatList
                                horizontal
                                data={ICEBREAKERS}
                                keyExtractor={item => item}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.icebreakerList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => setMessage(item)}
                                        style={[styles.icebreakerChip, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#ddd', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }]}
                                    >
                                        <VibeText size="xs" variant="medium">{item}</VibeText>
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    )}

                    <View style={styles.inputRow}>
                        <TouchableOpacity style={[styles.inputIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}>
                            <Smile size={24} color={currentColors.muted} />
                        </TouchableOpacity>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        color: remainingTime > 0 ? currentColors.text : currentColors.muted,
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'
                                    }
                                ]}
                                placeholder={remainingTime > 0 ? "Vibe here..." : "Session expired"}
                                placeholderTextColor={isDark ? '#555' : '#aaa'}
                                value={message}
                                onChangeText={(text) => {
                                    setMessage(text);
                                    // Notify backend user is typing
                                    if (activeSessionIdRef.current) {
                                        socketService.emit('typing', { sessionId: activeSessionIdRef.current, isTyping: true });
                                        
                                        // Reset idle timer to send typing:false after 3s
                                        if ((global as any).typingTimeout) clearTimeout((global as any).typingTimeout);
                                        (global as any).typingTimeout = setTimeout(() => {
                                            socketService.emit('typing', { sessionId: activeSessionIdRef.current, isTyping: false });
                                        }, 3000);
                                    }
                                }}
                                onSubmitEditing={sendMessage}
                                editable={remainingTime > 0}
                            />
                            <TouchableOpacity
                                disabled={remainingTime === 0}
                                style={[styles.micBtn, { backgroundColor: remainingTime > 0 ? colors.primary : colors.accent.red, opacity: remainingTime > 0 ? 1 : 0.5 }]}
                            >
                                <Mic size={18} color="white" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={remainingTime === 0}
                            style={[styles.inputIconBtn, { backgroundColor: `${colors.primary}1A`, opacity: remainingTime > 0 ? 1 : 0.5 }]}
                        >
                            <Send size={24} color={remainingTime > 0 ? colors.primary : currentColors.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomActions}>
                        <TouchableOpacity onPress={leaveChat}><VibeText variant="bold" size="xs" color={currentColors.muted}>LEAVE CHAT</VibeText></TouchableOpacity>
                        <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee' }]} />
                        <TouchableOpacity><VibeText variant="bold" size="xs" color="#ff4444">REPORT</VibeText></TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <VibeAlert
                visible={isAlertVisible}
                type={alertConfig.type}
                title={alertConfig.title}
                description={alertConfig.description}
                buttonText={alertConfig.buttonText || "Sweet!"}
                onButtonPress={async () => {
                    if (remainingTime === 0 && alertConfig.title === 'Time Up!') {
                        try {
                            const newSession = await chatService.extendSession(session!.id);

                            if (user?.walletBalance !== undefined) {
                                updateUserData({ walletBalance: user.walletBalance - 25 });
                            }

                            setAlertConfig({
                                title: 'Vibe Extended! 🎉',
                                description: '25 coins have been deducted. Enjoy your chat!',
                                type: 'success',
                                buttonText: 'Sweet!',
                            });
                            setRemainingTime(newSession.remainingSeconds);

                            // Immediately resync socket to join room again if it had previously errored/disconnected on timer expiry
                            socketService.emit('join-session', { sessionId: session!.id });
                            activeSessionIdRef.current = session!.id;

                            // Refresh chat history in case we missed messages in the dormant state
                            refreshHistory();

                        } catch (error: any) {
                            const errorData = error.response?.data;
                            const msg = errorData?.message || errorData?.error || error.message || 'Failed to extend session';
                            const isInsufficient = msg.toLowerCase().includes('insufficient');

                            setAlertConfig({
                                title: isInsufficient ? 'Out of Coins 🪙' : 'Error',
                                description: isInsufficient
                                    ? 'You need 25 coins to continue. Hit the wallet to fuel up your vibes!'
                                    : 'Something went wrong. Please try again.',
                                type: 'error',
                                buttonText: isInsufficient ? 'Go to Wallet' : 'Try Again',
                            });
                        }
                    } else if (alertConfig.buttonText === 'Go to Wallet') {
                        setIsAlertVisible(false);
                        navigation.navigate('Wallet');
                    } else {
                        setIsAlertVisible(false);
                        if (alertConfig.title === 'Connection Failed') {
                            navigation.goBack();
                        }
                    }
                }}
                onClose={() => setIsAlertVisible(false)}
                secondaryButtonText={remainingTime === 0 ? "Leave Chat" : undefined}
                onSecondaryButtonPress={leaveChat}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        ...containerStyles
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
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
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timerContainer: {
        alignItems: 'center',
        marginTop: 15,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#ee2b8c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    chatList: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    notice: {
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    msgWrapper: {
        marginBottom: 20,
    },
    msgBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        borderBottomLeftRadius: 4,
    },
    msgMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 4,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    icebreakerTitle: {
        marginBottom: 10,
        letterSpacing: 1,
    },
    icebreakerList: {
        marginBottom: 20,
    },
    icebreakerChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    inputIconBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        flex: 1,
        height: 50,
        marginHorizontal: 10,
        position: 'relative',
    },
    input: {
        flex: 1,
        borderRadius: 25,
        paddingLeft: 20,
        paddingRight: 50,
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    micBtn: {
        position: 'absolute',
        right: 5,
        top: 5,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    line: {
        height: 4,
        width: 80,
        borderRadius: 2,
    }
});

export default ChatScreen;
