import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

type Props = {
    children: React.ReactNode;
};

export const SocketLifecycleProvider: React.FC<Props> = ({ children }) => {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && user) {
                console.log('[SocketLifecycle] App came to foreground, connecting...');
                socketService.authenticate().catch((error) => {
                    console.error('[SocketLifecycle] foreground authenticate failed:', error);
                });
            } else if (nextAppState.match(/inactive|background/)) {
                console.log('[SocketLifecycle] App went to background, disconnecting...');
                socketService.disconnect();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        if (user) {
            socketService.authenticate().catch((error) => {
                console.error('[SocketLifecycle] initial authenticate failed:', error);
            });
        }

        return () => {
            subscription.remove();
            socketService.disconnect();
        };
    }, [user?.id, isLoading]);

    return <>{children}</>;
};

