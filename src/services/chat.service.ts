import api from './api';

export interface ChatSession {
    id: string;
    personaId: string;
    startTime: string;
    isPaid: boolean;
    status: string;
    remainingSeconds: number;
    totalSeconds: number;
}

export interface Message {
    id: string;
    sender: 'user' | 'persona';
    content: string;
    timestamp: string;
}

class ChatService {
    async startSession(personaId: string): Promise<ChatSession> {
        const response = await api.post('/chat/sessions', { personaId });
        return response.data.session;
    }

    async getSession(sessionId: string): Promise<ChatSession> {
        const response = await api.get(`/chat/sessions/${sessionId}`);
        return response.data.session;
    }

    async getMessages(sessionId: string): Promise<Message[]> {
        const response = await api.get(`/chat/sessions/${sessionId}/messages`);
        return response.data.messages;
    }

    async endSession(sessionId: string): Promise<void> {
        await api.delete(`/chat/sessions/${sessionId}`);
    }

    async getSessions(): Promise<ChatSession[]> {
        const response = await api.get('/chat/sessions');
        return response.data.sessions;
    }
}

export const chatService = new ChatService();
export default chatService;
