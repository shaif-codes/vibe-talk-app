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

/** Session details from GET /chat/sessions/:id (includes populated persona) */
export interface SessionDetails extends ChatSession {
    persona?: {
        _id?: string;
        id?: string;
        nickname?: string;
        avatarUrl?: string;
    };
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

    async getSession(sessionId: string): Promise<SessionDetails> {
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

    async extendSession(sessionId: string): Promise<ChatSession> {
        const response = await api.post(`/chat/sessions/${sessionId}/extend`);
        return response.data.session;
    }

    async getSessions(): Promise<ChatSession[]> {
        const response = await api.get('/chat/sessions');
        return response.data.sessions;
    }
}

export const chatService = new ChatService();
export default chatService;
