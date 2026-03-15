import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface GlassPanelProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, style, intensity = 12 }) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={[
            styles.panel,
            {
                backgroundColor: isDark ? colors.glass.background : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark ? colors.glass.border : 'rgba(255, 255, 255, 0.3)',
            },
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    panel: {
        borderWidth: 1,
        borderRadius: 24,
        overflow: 'hidden',
    }
});
