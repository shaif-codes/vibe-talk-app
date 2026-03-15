import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './api';

// Socket URL is same as API URL but without /api
const SOCKET_URL = API_URL.replace('/api', '');

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket) return;

        this.socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket'],
        });

        // Add auth token before connecting
        this.socket.on('connect_error', async (error) => {
            console.error('Socket Connection Error:', error);
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });
    }

    async authenticate() {
        if (!this.socket) this.connect();

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

        if (token) {
            this.socket!.auth = { token };
            this.socket!.connect();
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    off(event: string) {
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
