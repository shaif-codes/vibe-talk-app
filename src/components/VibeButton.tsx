import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { useTheme } from '../theme';
import { VibeText } from './VibeText';
import { VibeLoader } from './VibeLoader';
import { LinearGradient } from 'expo-linear-gradient';

interface VibeButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const VibeButton: React.FC<VibeButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    fullWidth = true,
    icon,
}) => {
    const { colors, currentColors, borderRadius } = useTheme();

    const getStyles = () => {
        let containerStyle: ViewStyle = {
            width: fullWidth ? '100%' : 'auto',
            height: 56,
            borderRadius: borderRadius.full,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
        };

        if (variant === 'outline') {
            containerStyle.borderWidth = 1;
            containerStyle.borderColor = isDark ? colors.glass.border : '#ddd';
        }

        return containerStyle;
    };

    const isDark = useTheme().isDark;

    if (variant === 'primary' && !disabled) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[getStyles(), style]}
            >
                <LinearGradient
                    colors={[colors.primary, '#ff4fa1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.full }]}
                />
                {loading ? (
                    <VibeLoader size={24} style={{ padding: 0 }} />
                ) : (
                    <>
                        {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
                        <VibeText variant="bold" color="white" size="lg" style={textStyle}>
                            {title}
                        </VibeText>
                    </>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                getStyles(),
                variant === 'secondary' && { backgroundColor: isDark ? 'white' : colors.text.light },
                style
            ]}
        >
            {loading ? (
                <VibeLoader size={24} style={{ padding: 0 }} />
            ) : (
                <>
                    {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
                    <VibeText
                        variant="bold"
                        color={variant === 'secondary' ? (isDark ? colors.text.light : 'white') : currentColors.text}
                        size="lg"
                        style={textStyle}
                    >
                        {title}
                    </VibeText>
                </>
            )}
        </TouchableOpacity>
    );
};

