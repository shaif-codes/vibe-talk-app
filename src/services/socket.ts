import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './api';
import crashlytics from '@react-native-firebase/crashlytics';

// Socket URL is same as API URL but without /api
const SOCKET_URL = API_URL.replace('/api', '');

class SocketService {
    private socket: Socket | null = null;
    private hasCoreListeners = false;
    private lastAuthToken: string | null = null;

    private ensureSocket() {
        if (this.socket) return;

        this.socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket'],
        });

        if (!this.hasCoreListeners) {
            this.socket.on('connect_error', (error) => {
                console.error('Socket Connection Error:', error);
                crashlytics().log(`Socket Connection Error: ${error.message}`);
                crashlytics().recordError(error);
            });

            this.socket.on('connect', () => {
                console.log('✅ Socket connected');
                crashlytics().log('Socket connected successfully');
            });

            this.socket.on('disconnect', (reason) => {
                console.log('❌ Socket disconnected');
                crashlytics().log(`Socket disconnected. Reason: ${reason}`);
            });

            this.hasCoreListeners = true;
        }
    }

    connect() {
        this.ensureSocket();
        if (!this.socket || this.socket.connected || this.socket.active) return;
        this.socket.connect();
    }

    async authenticate() {
        this.ensureSocket();

        let token = await SecureStore.getItemAsync('authToken');

        // Refresh token if it's a Firebase user
        try {
            const { auth } = require('../configs/firebase');
            if (auth.currentUser) {
                const freshToken = await auth.currentUser.getIdToken();
                if (freshToken) {
                    token = freshToken;
                    await SecureStore.setItemAsync('authToken', freshToken);
                }
            }
        } catch (e) {
            console.warn('[Socket] Could not refresh Firebase token:', e);
        }

        if (!token) {
            this.disconnect();
            return;
        }

        const tokenChanged = token !== this.lastAuthToken;
        this.lastAuthToken = token;
        this.socket!.auth = { token };

        if (this.socket!.connected) {
            if (tokenChanged) {
                this.socket!.disconnect();
                this.socket!.connect();
            }
            return;
        }

        if (!this.socket!.active) {
            this.socket!.connect();
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            // We don't nullify this.socket or remove listeners here
            // to preserve screen-level listeners during brief background/foreground cycles.
            // These are cleaned up by components using .off() or in logout.
        }
    }

    logout() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.hasCoreListeners = false;
            this.lastAuthToken = null;
        }
    }

    on(event: string, callback: (data: any) => void) {
        this.ensureSocket();
        this.socket?.off(event, callback);
        this.socket?.on(event, callback);
    }

    off(event: string, callback?: (data: any) => void) {
        if (callback) {
            this.socket?.off(event, callback);
            return;
        }
        this.socket?.off(event);
    }

    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
export default socketService;
