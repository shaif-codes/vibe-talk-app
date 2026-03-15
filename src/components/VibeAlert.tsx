import React from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import { useTheme } from '../theme';
import { VibeText } from './VibeText';
import { VibeButton } from './VibeButton';
import { Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface VibeAlertProps {
    visible: boolean;
    type?: 'success' | 'error' | 'info';
    title: string;
    description: string;
    buttonText?: string;
    onButtonPress?: () => void;
    onClose?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonPress?: () => void;
}

export const VibeAlert: React.FC<VibeAlertProps> = ({
    visible,
    type = 'info',
    title,
    description,
    buttonText = 'Sweet!',
    onButtonPress,
    onClose,
    secondaryButtonText,
    onSecondaryButtonPress,
}) => {
    const { colors, currentColors, isDark } = useTheme();

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 color={colors.accent.green || '#00E676'} size={48} />;
            case 'error':
                return <AlertCircle color={colors.accent.red || '#FF5252'} size={48} />;
            default:
                return <Sparkles color={colors.primary} size={48} />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'success':
                return `${colors.accent.green || '#00E676'}33`;
            case 'error':
                return `${colors.accent.red || '#FF5252'}33`;
            default:
                return `${colors.primary}1A`;
        }
    };

    const getGlow = () => {
        switch (type) {
            case 'success':
                return { shadowColor: colors.accent.green || '#00E676' };
            case 'error':
                return { shadowColor: colors.accent.red || '#FF5252' };
            default:
                return { shadowColor: colors.primary };
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <TouchableOpacity
                    activeOpacity={1}
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <View style={[
                    styles.content,
                    { backgroundColor: currentColors.surface, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }
                ]}>
                    {onClose && (
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <X size={20} color={currentColors.muted} />
                        </TouchableOpacity>
                    )}

                    <View style={styles.inner}>
                        <View style={[
                            styles.iconWrapper,
                            { backgroundColor: getIconBg() },
                            getGlow()
                        ]}>
                            {getIcon()}
                        </View>

                        <VibeText variant="display" size="2xl" style={styles.title}>
                            {title}
                        </VibeText>

                        <VibeText size="md" color={currentColors.muted} style={styles.description}>
                            {description}
                        </VibeText>

                        <VibeButton
                            title={buttonText}
                            onPress={onButtonPress || (() => { })}
                            style={styles.mainBtn}
                        />

                        {secondaryButtonText && (
                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={onSecondaryButtonPress}
                            >
                                <VibeText variant="semiBold" size="sm" color={currentColors.muted}>
                                    {secondaryButtonText}
                                </VibeText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    content: {
        width: '100%',
        borderRadius: 32,
        padding: 32,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 10,
    },
    closeBtn: {
        position: 'absolute',
        top: 24,
        right: 24,
        zIndex: 10,
    },
    inner: {
        alignItems: 'center',
    },
    iconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    title: {
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    mainBtn: {
        width: '100%',
    },
    secondaryBtn: {
        marginTop: 16,
        paddingVertical: 8,
    }
});
