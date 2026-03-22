import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import api from './api';

class NotificationService {
    private fcmToken: string | null = null;

    /**
     * Request notification permissions
     */
    async requestPermissions(): Promise<boolean> {
        try {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('❌ Android 13+ Notification permission denied');
                    return false;
                }
            }

            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('✅ Notification permissions granted:', authStatus);
                return true;
            } else {
                console.log('❌ Notification permissions denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    }

    /**
     * Get FCM token and register with backend
     */
    async registerForPushNotifications(): Promise<boolean> {
        try {
            // Request permissions first
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                console.log('⚠️  No notification permission, skipping token registration');
                return false;
            }

            // Get FCM token
            const token = await messaging().getToken();

            if (!token) {
                console.error('❌ Failed to get FCM token');
                return false;
            }

            this.fcmToken = token;
            console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');

            // Register token with backend
            await api.post('/notifications/register-token', { token });
            console.log('✅ FCM token registered with backend');

            return true;
        } catch (error) {
            console.error('❌ Error registering for push notifications:', error);
            return false;
        }
    }

    /**
     * Setup notification listeners
     */
    setupNotificationListeners(navigation: any) {
        // Handle foreground notifications
        const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
            console.log('📬 Foreground notification received:', remoteMessage);

            // Show in-app notification
            if (remoteMessage.notification) {
                Alert.alert(
                    remoteMessage.notification.title || 'New Notification',
                    remoteMessage.notification.body || '',
                    [
                        {
                            text: 'Dismiss',
                            style: 'cancel'
                        },
                        {
                            text: 'View',
                            onPress: () => this.handleNotificationTap(remoteMessage, navigation)
                        }
                    ]
                );
            }
        });

        // Handle notification tap when app is in background
        const unsubscribeBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
            console.log('📬 Notification opened app from background:', remoteMessage);
            this.handleNotificationTap(remoteMessage, navigation);
        });

        // Handle notification tap when app was killed
        messaging()
            .getInitialNotification()
            .then((remoteMessage) => {
                if (remoteMessage) {
                    console.log('📬 Notification opened app from killed state:', remoteMessage);
                    this.handleNotificationTap(remoteMessage, navigation);
                }
            });

        // Handle token refresh
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
            console.log('🔄 FCM token refreshed:', token.substring(0, 20) + '...');
            this.fcmToken = token;

            try {
                await api.post('/notifications/register-token', { token });
                console.log('✅ Refreshed FCM token registered with backend');
            } catch (error) {
                console.error('❌ Error registering refreshed token:', error);
            }
        });

        // Return cleanup function
        return () => {
            unsubscribeForeground();
            unsubscribeBackground();
            unsubscribeTokenRefresh();
        };
    }

    /**
     * Handle notification tap - navigate to appropriate screen
     */
    private handleNotificationTap(remoteMessage: any, navigation: any) {
        const data = remoteMessage.data;

        if (!data) return;

        // Navigate based on notification type
        if (data.type === 'message' && data.sessionId) {
            // Navigate to chat screen with the persona
            navigation.navigate('Chat', {
                sessionId: data.sessionId,
                personaId: data.personaId
            });
        } else if (data.type === 'system') {
            // Navigate to appropriate system screen
            // You can customize this based on your app structure
            navigation.navigate('Home');
        }
    }

    /**
     * Unregister FCM token (call on logout)
     */
    async unregisterToken(): Promise<boolean> {
        try {
            if (!this.fcmToken) {
                console.log('⚠️  No FCM token to unregister');
                return true;
            }

            await api.delete('/notifications/unregister-token', {
                data: { token: this.fcmToken }
            });

            console.log('✅ FCM token unregistered from backend');
            this.fcmToken = null;

            return true;
        } catch (error) {
            console.error('❌ Error unregistering FCM token:', error);
            return false;
        }
    }

    /**
     * Get current FCM token
     */
    getToken(): string | null {
        return this.fcmToken;
    }
}

export default new NotificationService();
