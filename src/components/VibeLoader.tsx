import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle, Dimensions } from 'react-native';
import { useTheme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { VibeText } from './VibeText';

const { width } = Dimensions.get('window');

const MESSAGES = [
    "Manifesting your vibe...",
    "Tuning your frequency...",
    "Consulting the vibe-check gods...",
    "Scanning the universe...",
    "Aligning digital stars...",
    "Cooking up some cool energy..."
];

interface VibeLoaderProps {
    size?: number;
    fullScreen?: boolean;
    advanced?: boolean;
    style?: ViewStyle;
}

const Particle = ({ delay, orbSize, color }: { delay: number, orbSize: number, color: string }) => {
    const moveAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const sideOffset = useRef(Math.random() * orbSize - orbSize / 2).current;

    useEffect(() => {
        const startAnimation = () => {
            moveAnim.setValue(0);
            opacityAnim.setValue(0);

            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(moveAnim, {
                        toValue: -orbSize * 1.5,
                        duration: 2000 + Math.random() * 2000,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(opacityAnim, { toValue: 0.6, duration: 500, useNativeDriver: true }),
                        Animated.timing(opacityAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
                    ])
                ])
            ]).start(() => startAnimation());
        };

        startAnimation();
    }, []);

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    backgroundColor: color,
                    width: 3 + Math.random() * 3,
                    height: 3 + Math.random() * 3,
                    transform: [
                        { translateY: moveAnim },
                        { translateX: sideOffset }
                    ],
                    opacity: opacityAnim,
                }
            ]}
        />
    );
};

export const VibeLoader: React.FC<VibeLoaderProps> = ({
    size = 40,
    fullScreen = false,
    advanced = false,
    style
}) => {
    const { colors, currentColors, isDark } = useTheme();
    const [messageIndex, setMessageIndex] = useState(0);

    const particles = advanced ? [
        { id: 1, delay: 0, color: colors.primary },
        { id: 2, delay: 500, color: '#a855f7' },
        { id: 3, delay: 1000, color: '#4ade80' },
        { id: 4, delay: 1500, color: colors.primary },
        { id: 5, delay: 200, color: '#ff4fa1' },
        { id: 6, delay: 700, color: '#a855f7' },
        { id: 7, delay: 1200, color: '#4ade80' },
        { id: 8, delay: 1700, color: colors.primary },
    ] : [];

    // Common rotate for simple mode
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Advanced animations
    const ring1Rotate = useRef(new Animated.Value(0)).current;
    const ring2Rotate = useRef(new Animated.Value(0)).current;
    const ring3Rotate = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeMessageAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Simple rotation for non-advanced mode
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        if (advanced) {
            // Complex orbital rotations
            Animated.loop(
                Animated.timing(ring1Rotate, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
            ).start();

            Animated.loop(
                Animated.timing(ring2Rotate, { toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true })
            ).start();

            Animated.loop(
                Animated.timing(ring3Rotate, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
            ).start();

            // Breathing pulse
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 1500, easing: Easing.out(Easing.sin), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.in(Easing.sin), useNativeDriver: true })
                ])
            ).start();

            // Message rotation
            const messageInterval = setInterval(() => {
                Animated.sequence([
                    Animated.timing(fadeMessageAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                    Animated.delay(100),
                ]).start(() => {
                    setMessageIndex(prev => (prev + 1) % MESSAGES.length);
                    Animated.timing(fadeMessageAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
                });
            }, 3000);

            return () => clearInterval(messageInterval);
        }
    }, [advanced]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const spin1 = ring1Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const spin2 = ring2Rotate.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
    const spin3 = ring3Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    if (advanced) {
        const orbSize = size * 2.5;
        return (
            <View style={[styles.advancedContainer, style]}>
                <View style={[styles.orbWrapper, { width: orbSize + 40, height: orbSize + 40 }]}>
                    {/* Particles */}
                    {particles.map(p => (
                        <Particle key={p.id} delay={p.delay} orbSize={orbSize} color={p.color} />
                    ))}

                    {/* Ring 3 (Inner - Fast) */}
                    <Animated.View style={[
                        styles.ring,
                        {
                            width: orbSize * 0.7,
                            height: orbSize * 0.7,
                            borderColor: '#4ade80',
                            transform: [{ rotate: spin3 }, { rotateX: '45deg' }, { rotateY: '45deg' }]
                        }
                    ]} />

                    {/* Ring 2 (Middle - Reverse) */}
                    <Animated.View style={[
                        styles.ring,
                        {
                            width: orbSize * 0.85,
                            height: orbSize * 0.85,
                            borderColor: '#a855f7',
                            transform: [{ rotate: spin2 }, { rotateX: '60deg' }]
                        }
                    ]} />

                    {/* Ring 1 (Outer - Slow) */}
                    <Animated.View style={[
                        styles.ring,
                        {
                            width: orbSize,
                            height: orbSize,
                            borderColor: colors.primary,
                            transform: [{ rotate: spin1 }, { rotateY: '60deg' }]
                        }
                    ]} />

                    {/* Central Core */}
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <LinearGradient
                            colors={[colors.primary, '#ff4fa1', '#a855f7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                styles.core,
                                {
                                    width: orbSize * 0.4,
                                    height: orbSize * 0.4,
                                    borderRadius: (orbSize * 0.4) / 2,
                                    shadowColor: colors.primary,
                                }
                            ]}
                        />
                    </Animated.View>
                </View>

                {/* Animated Manifesto Text */}
                <Animated.View style={{ opacity: fadeMessageAnim, marginTop: 30, alignItems: 'center' }}>
                    <VibeText variant="medium" size="lg" style={{ color: isDark ? '#e2e8f0' : '#333' }}>
                        {MESSAGES[messageIndex]}
                    </VibeText>
                    <VibeText size="xs" color={currentColors.muted} style={{ marginTop: 8, letterSpacing: 1 }}>
                        YOUR VIBE IS LOADING
                    </VibeText>
                </Animated.View>
            </View>
        );
    }

    const loaderContent = (
        <View style={[styles.loaderContainer, { width: size, height: size }]}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <LinearGradient
                    colors={[colors.primary, '#ff4fa1', 'transparent']}
                    style={[
                        styles.circle,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderWidth: size / 8,
                            borderColor: 'rgba(238, 43, 140, 0.1)'
                        }
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>
        </View>
    );

    if (fullScreen) {
        return (
            <View style={[styles.contentLoader, style]}>
                {loaderContent}
            </View>
        );
    }

    return (
        <View style={style}>
            {loaderContent}
        </View>
    );
};

const styles = StyleSheet.create({
    contentLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    advancedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    orbWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ring: {
        position: 'absolute',
        borderRadius: 500,
        borderWidth: 1.5,
        opacity: 0.8,
    },
    core: {
        borderRadius: 50,
        elevation: 20,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
    },
    particle: {
        position: 'absolute',
        borderRadius: 10,
    },
    loaderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        backgroundColor: 'transparent',
    },
});

