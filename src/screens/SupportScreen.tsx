import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ActivityIndicator,
    Image,
    Keyboard
} from 'react-native';
import {
    ChevronLeft,
    Send,
    MessageCircle,
    Circle
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../services/api';
import { auth } from '../configs/firebase';
import { socketService } from '../services/socket';

interface ISupportMessage {
    _id?: string;
    senderType: 'user' | 'admin' | 'system';
    content: string;
    timestamp: string;
}

interface ISupportSession {
    _id: string;
    status: 'waiting' | 'active' | 'closed';
    isAiHandled: boolean;
}

const SupportScreen = ({ navigation }: any) => {
    const { colors, currentColors, spacing, borderRadius, isDark } = useTheme();
    const { user } = useAuth();
    const [session, setSession] = useState<ISupportSession | null>(null);
    const [messages, setMessages] = useState<ISupportMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        initializeSupport();

        const handleMessage = (message: ISupportMessage) => {
            setMessages(prev => [...prev, message]);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
        };

        socketService.on('support:message_received', handleMessage);
        const handleClosed = () => {
            setSession(prev => prev ? { ...prev, status: 'closed' } : null);
        };
        socketService.on('support:closed', handleClosed);

        return () => {
            socketService.off('support:message_received', handleMessage);
            socketService.off('support:closed', handleClosed);
        };
    }, []);

    const initializeSupport = async () => {
        try {
            setLoading(true);
            const token = await auth.currentUser?.getIdToken();
            const response = await axios.post(`${API_URL}/support/sessions`, {
                subject: 'Mobile App Support'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const sessionData = response.data;
            setSession(sessionData);

            // Fetch chat history
            const historyResponse = await axios.get(`${API_URL}/support/sessions/${sessionData._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(historyResponse.data.messages);

            // Join socket room
            socketService.emit('support:join', { sessionId: sessionData._id });

            setTimeout(() => flatListRef.current?.scrollToEnd(), 500);
        } catch (error) {
            console.error('Initialize support error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !session) return;

        const messageContent = input.trim();
        setInput('');

        socketService.emit('support:send_message', {
            sessionId: session._id,
            content: messageContent
        });
    };

    const renderMessage = ({ item }: { item: ISupportMessage }) => {
        const isUser = item.senderType === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : styles.adminMessage,
                { marginBottom: spacing.sm }
            ]}>
                <View style={[
                    styles.messageBubble,
                    {
                        backgroundColor: isUser ? colors.primary : currentColors.surface,
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                    }
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? '#fff' : currentColors.text }
                    ]}>
                        {item.content}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        { color: isUser ? 'rgba(255,255,255,0.7)' : currentColors.muted }
                    ]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: currentColors.muted, marginTop: spacing.md, textAlign: 'center' }}>Connecting to support...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee', borderBottomWidth: 1, padding: spacing.md }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={currentColors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: currentColors.text }]}>iChat Support</Text>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: session?.status === 'closed' ? '#999' : '#4CAF50' }]} />
                        <Text style={[styles.statusText, { color: currentColors.muted }]}>
                            {session?.status === 'active' ? 'Human Agent Connected' : session?.status === 'waiting' ? 'AI Assistant' : 'Closed'}
                        </Text>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={{ padding: spacing.md }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />

                <View style={[styles.inputContainer, { backgroundColor: currentColors.surface, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee', borderTopWidth: 1, padding: spacing.sm }]}>
                    <TextInput
                        style={[styles.input, { color: currentColors.text, backgroundColor: currentColors.background, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, maxHeight: 100 }]}
                        placeholder="Describe your issue..."
                        placeholderTextColor={currentColors.muted}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        editable={session?.status !== 'closed'}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!input.trim() || session?.status === 'closed'}
                        style={[styles.sendButton, { backgroundColor: colors.primary, borderRadius: borderRadius.full }]}
                    >
                        <Send size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
    },
    messageContainer: {
        flexDirection: 'row',
        width: '100%',
    },
    userMessage: {
        justifyContent: 'flex-end',
    },
    adminMessage: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        minHeight: 40,
        paddingTop: 8,
        paddingBottom: 8,
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SupportScreen;
