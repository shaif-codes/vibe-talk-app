import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { VibeText } from '../components/VibeText';
import { useAuth } from '../context/AuthContext';
import { VibeAlert } from '../components/VibeAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Coins, TrendingUp, TrendingDown, Gift } from 'lucide-react-native';
import api from '../services/api';

const WalletScreen = ({ navigation }: any) => {
    const { user, updateUserData } = useAuth();
    const { colors, currentColors, isDark } = useTheme();
    const [couponCode, setCouponCode] = useState('');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeemLoading, setRedeemLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState<any>({ visible: false, title: '', description: '', type: 'info' });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/users/wallet/transactions');
            setTransactions(response.data.transactions);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async () => {
        if (!couponCode.trim()) return;

        setRedeemLoading(true);
        try {
            const response = await api.post('/users/wallet/redeem-coupon', { code: couponCode });

            // Update context
            await updateUserData({ walletBalance: response.data.newBalance });

            // Show success
            setAlertConfig({
                visible: true,
                title: 'Success!',
                description: `You've redeemed ${response.data.amountAdded} coins!`,
                type: 'success',
                buttonText: 'Awesome',
                onButtonPress: () => setAlertConfig({ ...alertConfig, visible: false })
            });

            setCouponCode('');
            fetchTransactions();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to redeem coupon';
            setAlertConfig({
                visible: true,
                title: 'Oops',
                description: msg,
                type: 'error',
                buttonText: 'Try Again',
                onButtonPress: () => setAlertConfig({ ...alertConfig, visible: false })
            });
        } finally {
            setRedeemLoading(false);
        }
    };

    const TransactionItem = ({ item }: { item: any }) => (
        <View style={[styles.transactionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}>
            <View style={styles.transactionLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.type === 'credit' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                    {item.type === 'credit' ? (
                        <TrendingUp size={20} color="#22c55e" />
                    ) : (
                        <TrendingDown size={20} color="#ef4444" />
                    )}
                </View>
                <View>
                    <VibeText variant="medium" size="md">{item.description}</VibeText>
                    <VibeText color={currentColors.muted} size="xs" style={{ marginTop: 2 }}>
                        {new Date(item.timestamp).toLocaleDateString()}
                    </VibeText>
                </View>
            </View>
            <VibeText
                variant="bold"
                size="md"
                style={{ color: item.type === 'credit' ? '#22c55e' : currentColors.text }}
            >
                {item.type === 'credit' ? '+' : '-'}{item.amount}
            </VibeText>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: currentColors.surface }]}>
                    <ChevronLeft size={24} color={currentColors.text} />
                </TouchableOpacity>
                <VibeText variant="bold" size="xl">Wallet</VibeText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Balance Card */}
                <LinearGradient
                    colors={[colors.primary, '#ff4fa1']}
                    style={styles.balanceCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.balanceInner}>
                        <VibeText color="rgba(255,255,255,0.8)" size="sm" variant="medium">Total Balance</VibeText>
                        <View style={styles.balanceAmountContainer}>
                            <Coins size={36} color="white" style={{ marginRight: 12, marginTop: 4 }} />
                            <VibeText variant="display" style={styles.balanceAmount}>
                                {user?.walletBalance?.toLocaleString() || '0'}
                            </VibeText>
                        </View>
                        <VibeText color="rgba(255,255,255,0.9)" size="sm" style={{ marginTop: 8 }}>
                            Use coins to extend your vibes.
                        </VibeText>
                    </View>
                </LinearGradient>

                {/* Redeem Section */}
                <View style={styles.section}>
                    <VibeText variant="bold" size="sm" color={currentColors.muted} style={styles.sectionTitle}>
                        REDEEM COUPON
                    </VibeText>
                    <View style={[styles.redeemContainer, { backgroundColor: currentColors.surface }]}>
                        <View style={styles.inputWrapper}>
                            <Gift size={20} color={currentColors.muted} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: currentColors.text, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f9f9f9' }]}
                                placeholder="Enter promo code"
                                placeholderTextColor={currentColors.muted}
                                value={couponCode}
                                onChangeText={setCouponCode}
                                autoCapitalize="characters"
                            />
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.redeemButton,
                                { backgroundColor: couponCode.trim() ? colors.primary : currentColors.muted }
                            ]}
                            disabled={!couponCode.trim() || redeemLoading}
                            onPress={handleRedeem}
                        >
                            <VibeText variant="bold" color="white">
                                {redeemLoading ? '...' : 'Redeem'}
                            </VibeText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Purchase Coins Section (Mock) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <VibeText variant="bold" size="sm" color={currentColors.muted}>
                            PURCHASE COINS
                        </VibeText>
                        <View style={[styles.badge, { backgroundColor: 'rgba(238,43,140,0.1)' }]}>
                            <VibeText size="xs" color={colors.primary} variant="bold">HOT</VibeText>
                        </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packagesContainer}>
                        {[
                            { coins: 100, price: '$0.99', popular: false },
                            { coins: 500, price: '$4.99', popular: true },
                            { coins: 1200, price: '$9.99', popular: false },
                        ].map((pkg, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.packageCard,
                                    {
                                        backgroundColor: currentColors.surface,
                                        borderColor: pkg.popular ? colors.primary : 'transparent',
                                        borderWidth: pkg.popular ? 2 : 0
                                    }
                                ]}
                            >
                                {pkg.popular && (
                                    <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                                        <VibeText size="xs" color="white" variant="bold">Best Value</VibeText>
                                    </View>
                                )}
                                <Coins size={32} color={pkg.popular ? colors.primary : colors.primary} style={{ marginBottom: 12 }} />
                                <VibeText variant="bold" size="lg">{pkg.coins}</VibeText>
                                <VibeText color={currentColors.muted} size="sm" style={{ marginBottom: 16 }}>Coins</VibeText>
                                <View style={[styles.priceTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}>
                                    <VibeText variant="medium">{pkg.price}</VibeText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Transactions */}
                <View style={styles.section}>
                    <VibeText variant="bold" size="sm" color={currentColors.muted} style={styles.sectionTitle}>
                        RECENT TRANSACTIONS
                    </VibeText>
                    <View style={[styles.transactionsContainer, { backgroundColor: currentColors.surface }]}>
                        {loading ? (
                            <View style={{ padding: 24, alignItems: 'center' }}>
                                <VibeText color={currentColors.muted}>Loading...</VibeText>
                            </View>
                        ) : transactions.length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center' }}>
                                <Coins size={40} color={currentColors.muted} style={{ marginBottom: 16, opacity: 0.5 }} />
                                <VibeText color={currentColors.muted}>No transactions yet</VibeText>
                            </View>
                        ) : (
                            transactions.map((tx: any) => (
                                <TransactionItem key={tx._id} item={tx} />
                            ))
                        )}
                    </View>
                </View>

            </ScrollView>

            <VibeAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                description={alertConfig.description}
                type={alertConfig.type}
                buttonText={alertConfig.buttonText}
                onButtonPress={alertConfig.onButtonPress}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    balanceCard: {
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
    },
    balanceInner: {
        padding: 24,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    balanceAmountContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
    },
    balanceAmount: {
        fontSize: 48,
        color: 'white',
        letterSpacing: -1,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        paddingHorizontal: 24,
        marginBottom: 12,
        letterSpacing: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    redeemContainer: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        top: 14,
        zIndex: 1,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingLeft: 44,
        paddingRight: 16,
        fontFamily: 'sans-serif-medium',
        fontSize: 16,
    },
    redeemButton: {
        height: 50,
        paddingHorizontal: 20,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    packagesContainer: {
        paddingHorizontal: 20,
        gap: 16,
    },
    packageCard: {
        width: 140,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priceTag: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    transactionsContainer: {
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
});

export default WalletScreen;
