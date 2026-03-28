import { Audio } from 'expo-av';

class AudioService {
    private notificationSound: Audio.Sound | null = null;
    private isLoaded: boolean = false;

    constructor() {
        this.loadSound();
    }

    private async loadSound() {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/ping.mp3')
            );
            this.notificationSound = sound;
            this.isLoaded = true;
            console.log('🎵 Notification sound loaded successfully');
        } catch (error) {
            console.warn('❌ Failed to load notification sound:', error);
        }
    }

    public async playNotificationSound() {
        try {
            if (!this.notificationSound) {
                // Try reloading if not loaded
                await this.loadSound();
            }

            if (this.notificationSound) {
                // Reset position to start before playing
                await this.notificationSound.setPositionAsync(0);
                await this.notificationSound.playAsync();
            }
        } catch (error) {
            console.error('❌ Error playing notification sound:', error);
        }
    }

    public async cleanup() {
        if (this.notificationSound) {
            await this.notificationSound.unloadAsync();
            this.isLoaded = false;
        }
    }
}

export default new AudioService();
