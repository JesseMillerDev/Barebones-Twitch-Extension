class ApiService {
    constructor() {
        this.baseUrl = 'https://your-api-base-url/api/viewerdemographics';
        this.offlineEvents = [];
        this.isOnline = navigator.onLine;
        this.setupConnectionListeners();
    }

    setupConnectionListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processCachedEvents();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async makeRequest(endpoint, method, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            if (!this.isOnline) {
                this.cacheOfflineEvent(endpoint, method, data);
            }
            throw error;
        }
    }

    getAuthToken() {
        // Get token from Twitch extension helper
        return window.Twitch?.ext?.viewer?.sessionToken || '';
    }

    cacheOfflineEvent(endpoint, method, data) {
        this.offlineEvents.push({
            endpoint,
            method,
            data,
            timestamp: new Date().toISOString()
        });

        // Store in localStorage as backup
        localStorage.setItem('offlineEvents', JSON.stringify(this.offlineEvents));
    }

    async processCachedEvents() {
        if (this.offlineEvents.length === 0) return;

        try {
            const events = [...this.offlineEvents];
            const result = await this.makeRequest('/batch/offline-events', 'POST', {
                events: events,
                streamerId: this.getStreamerId()
            });

            if (result.success) {
                this.offlineEvents = [];
                localStorage.removeItem('offlineEvents');
            }
        } catch (error) {
            console.error('Failed to process offline events:', error);
        }
    }

    getStreamerId() {
        return window.Twitch?.ext?.channel?.id || '';
    }

    // API Endpoint Methods
    async captureViewerOptIn(optInData) {
        const data = {
            streamerId: this.getStreamerId(),
            viewerId: window.Twitch?.ext?.viewer?.id,
            optInLevel: optInData.tier,
            timestamp: new Date().toISOString(),
            preferences: {
                notifications: optInData.notifications,
                dataCollection: optInData.dataCollection,
                features: optInData.features
            }
        };

        return await this.makeRequest('/viewer/optin', 'POST', data);
    }

    async recordInteraction(interactionData) {
        const data = {
            streamerId: this.getStreamerId(),
            viewerId: window.Twitch?.ext?.viewer?.id,
            interactionType: interactionData.type,
            timestamp: new Date().toISOString(),
            details: interactionData.details
        };

        return await this.makeRequest('/interaction', 'POST', data);
    }

    async recordSessionEnd(sessionData) {
        const data = {
            streamerId: this.getStreamerId(),
            viewerId: window.Twitch?.ext?.viewer?.id,
            sessionDuration: sessionData.duration,
            timestamp: new Date().toISOString(),
            interactions: sessionData.interactions,
            features: sessionData.featuresUsed
        };

        return await this.makeRequest('/viewer/session/end', 'POST', data);
    }

    async sendHeartbeat(status) {
        const data = {
            streamerId: this.getStreamerId(),
            viewerId: window.Twitch?.ext?.viewer?.id,
            timestamp: new Date().toISOString(),
            status: {
                active: status.active,
                currentFeatures: status.features,
                lastInteraction: status.lastInteraction
            }
        };

        return await this.makeRequest('/viewer/heartbeat', 'POST', data);
    }
}

export default new ApiService();
