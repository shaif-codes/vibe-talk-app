import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface VibeTextProps extends TextProps {
    variant?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'display';
    size?: keyof typeof theme.typography.size;
    color?: string;
}

import { theme } from '../theme';

export const VibeText: React.FC<VibeTextProps> = ({
    variant = 'regular',
    size = 'md',
    color,
    style,
    children,
    ...props
}) => {
    const { currentColors, typography } = useTheme();

    const fontStyles = {
        fontFamily: typography.fontFamily[variant],
        fontSize: typography.size[size],
        color: color || currentColors.text,
    };

    return (
        <Text style={[fontStyles, style]} {...props}>
            {children}
        </Text>
    );
};
