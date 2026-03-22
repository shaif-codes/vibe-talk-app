import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

export type NotificationPayload = {
    sessionId?: string;
    message?: string;
    senderName?: string;
    senderAvatar?: string;
    personaId?: string;
    [key: string]: any;
};

type NotificationItem = {
    notificationId: string;
    type: string;
    payload: NotificationPayload;
    createdAt: string;
    status: 'sent' | 'delivered' | 'read';
};

type NotificationContextType = {
    notifications: NotificationItem[];
    unreadCount: number;
    markNotificationAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    /** Mark all notifications for a given session as read (e.g. when user opens that chat). */
    markNotificationsAsReadBySessionId: (sessionId: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const handleNewNotification = (data: NotificationItem) => {
            if (!data?.notificationId) return;

            setNotifications((prev) => {
                const exists = prev.some((item) => item.notificationId === data.notificationId);
                if (exists) return prev;
                return [{ ...data, status: 'sent' }, ...prev];
            });

            socketService.emit('notification-delivered', {
                notificationId: data.notificationId
            });
        };

        const handleNotificationStatusUpdated = (data: { notificationId: string; status: 'sent' | 'delivered' | 'read' }) => {
            if (!data?.notificationId) return;

            setNotifications((prev) =>
                prev.map((item) =>
                    item.notificationId === data.notificationId
                        ? { ...item, status: data.status }
                        : item
                )
            );
        };

        socketService.on('new-notification', handleNewNotification);
        socketService.on('notification-status-updated', handleNotificationStatusUpdated);

        return () => {
            socketService.off('new-notification', handleNewNotification);
            socketService.off('notification-status-updated', handleNotificationStatusUpdated);
        };
    }, [user?.id]);

    const markNotificationAsRead = useCallback((notificationId: string) => {
        if (!notificationId) return;

        socketService.emit('read-notification', { notificationId });
        setNotifications((prev) =>
            prev.map((item) =>
                item.notificationId === notificationId
                    ? { ...item, status: 'read' }
                    : item
            )
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => {
            prev.forEach((item) => {
                if (item.status !== 'read') {
                    socketService.emit('read-notification', { notificationId: item.notificationId });
                }
            });
            return prev.map((item) => ({ ...item, status: 'read' }));
        });
    }, []);

    const markNotificationsAsReadBySessionId = useCallback((sessionId: string) => {
        if (!sessionId) return;
        setNotifications((prev) => {
            const toMark = prev.filter(
                (item) => item.payload?.sessionId === sessionId && item.status !== 'read'
            );
            toMark.forEach((item) => {
                socketService.emit('read-notification', { notificationId: item.notificationId });
            });
            const ids = new Set(toMark.map((n) => n.notificationId));
            return prev.map((item) =>
                ids.has(item.notificationId) ? { ...item, status: 'read' as const } : item
            );
        });
    }, []);

    const unreadCount = useMemo(
        () => notifications.filter((item) => item.status !== 'read').length,
        [notifications]
    );

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                markNotificationAsRead,
                markAllAsRead,
                markNotificationsAsReadBySessionId
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

