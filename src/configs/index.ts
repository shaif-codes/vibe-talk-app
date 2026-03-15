import { ViewStyle } from 'react-native';

export const containerStyles: ViewStyle = {
    marginTop: '1%',
    flex: 1,
};

// loading the environment variables for google OAuth
export const googleAuthConfigs = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
}