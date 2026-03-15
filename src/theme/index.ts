import { colors } from './colors';
import { typography } from './typography';
import { useColorScheme } from 'react-native';

export const theme = {
    colors,
    typography,
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
    },
    borderRadius: {
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        full: 9999,
    }
};

import { useAuth } from '../context/AuthContext';

export const useTheme = () => {
    const { themePreference } = useAuth();
    const systemColorScheme = useColorScheme();

    const isDark = themePreference === 'system'
        ? systemColorScheme === 'dark'
        : themePreference === 'dark';

    return {
        ...theme,
        isDark,
        currentColors: {
            background: isDark ? colors.background.dark : colors.background.light,
            text: isDark ? colors.text.dark : colors.text.light,
            muted: isDark ? colors.text.mutedDark : colors.text.mutedLight,
            surface: isDark ? colors.surface.dark : colors.surface.light,
        }
    };
};
