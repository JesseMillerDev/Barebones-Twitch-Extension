import '../styles/config.css';

class ConfigurationPanel {
    constructor() {
        this.defaultConfig = {
            pointsEnabled: true,
            rewards: {
                enhanced: 1000,
                premium: 2500
            },
            features: {
                enhancedTier: true,
                premiumTier: true
            }
        };
        
        this.currentConfig = { ...this.defaultConfig };
        this.initialize();
    }

    initialize() {
        // Wait for Twitch API
        if (window.Twitch) {
            Twitch.ext.configuration.onChanged(() => {
                this.loadConfiguration();
            });

            // Get initial configuration if it exists
            this.loadConfiguration();
        }

        this.render();
        this.attachEventListeners();
    }

    loadConfiguration() {
        try {
            const config = JSON.parse(Twitch.ext.configuration.broadcaster?.content || '{}');
            this.currentConfig = { ...this.defaultConfig, ...config };
            this.updateFormValues();
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.showNotification('Error loading configuration', 'error');
        }
    }

    render() {
        const container = document.createElement('div');
        container.className = 'config-container';
        container.innerHTML = `
            <div class="config-panel">
                <div class="config-header">
                    <h1>Channel Experience Configuration</h1>
                    <div id="notification" class="notification"></div>
                </div>

                <div class="config-section">
                    <h2>Channel Points Settings</h2>
                    <div class="setting-group">
                        <label class="toggle-setting">
                            <span>Enable Channel Points Rewards</span>
                            <div class="toggle-wrapper">
                                <input type="checkbox" id="pointsEnabled" 
                                    ${this.currentConfig.pointsEnabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                    </div>

                    <div class="rewards-config" id="rewardsConfig">
                        <div class="reward-item">
                            <label>Enhanced Tier Reward</label>
                            <div class="input-group">
                                <input type="number" id="enhancedPoints" 
                                    value="${this.currentConfig.rewards.enhanced}"
                                    min="0" max="100000">
                                <span class="input-suffix">points</span>
                            </div>
                        </div>

                        <div class="reward-item">
                            <label>Premium Tier Reward</label>
                            <div class="input-group">
                                <input type="number" id="premiumPoints" 
                                    value="${this.currentConfig.rewards.premium}"
                                    min="0" max="100000">
                                <span class="input-suffix">points</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="config-section">
                    <h2>Feature Settings</h2>
                    <div class="setting-group">
                        <label class="toggle-setting">
                            <span>Enable Enhanced Tier</span>
                            <div class="toggle-wrapper">
                                <input type="checkbox" id="enhancedTier"
                                    ${this.currentConfig.features.enhancedTier ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                        </label>

                        <label class="toggle-setting">
                            <span>Enable Premium Tier</span>
                            <div class="toggle-wrapper">
                                <input type="checkbox" id="premiumTier"
                                    ${this.currentConfig.features.premiumTier ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="config-actions">
                    <button id="saveConfig" class="primary-button">Save Changes</button>
                    <button id="resetConfig" class="secondary-button">Reset to Default</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    attachEventListeners() {
        // Points enable/disable toggle
        const pointsEnabled = document.getElementById('pointsEnabled');
        const rewardsConfig = document.getElementById('rewardsConfig');
        
        pointsEnabled?.addEventListener('change', (e) => {
            const inputs = rewardsConfig.querySelectorAll('input[type="number"]');
            inputs.forEach(input => input.disabled = !e.target.checked);
            rewardsConfig.style.opacity = e.target.checked ? '1' : '0.5';
        });

        // Save button
        document.getElementById('saveConfig')?.addEventListener('click', () => {
            this.saveConfiguration();
        });

        // Reset button
        document.getElementById('resetConfig')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to default values?')) {
                this.currentConfig = { ...this.defaultConfig };
                this.updateFormValues();
                this.showNotification('Settings reset to default values', 'success');
            }
        });
    }

    updateFormValues() {
        const pointsEnabled = document.getElementById('pointsEnabled');
        const enhancedPoints = document.getElementById('enhancedPoints');
        const premiumPoints = document.getElementById('premiumPoints');
        const enhancedTier = document.getElementById('enhancedTier');
        const premiumTier = document.getElementById('premiumTier');
        const rewardsConfig = document.getElementById('rewardsConfig');

        if (pointsEnabled) {
            pointsEnabled.checked = this.currentConfig.pointsEnabled;
            const inputs = rewardsConfig.querySelectorAll('input[type="number"]');
            inputs.forEach(input => input.disabled = !this.currentConfig.pointsEnabled);
            rewardsConfig.style.opacity = this.currentConfig.pointsEnabled ? '1' : '0.5';
        }

        if (enhancedPoints) enhancedPoints.value = this.currentConfig.rewards.enhanced;
        if (premiumPoints) premiumPoints.value = this.currentConfig.rewards.premium;
        if (enhancedTier) enhancedTier.checked = this.currentConfig.features.enhancedTier;
        if (premiumTier) premiumTier.checked = this.currentConfig.features.premiumTier;
    }

    async saveConfiguration() {
        try {
            const newConfig = {
                pointsEnabled: document.getElementById('pointsEnabled').checked,
                rewards: {
                    enhanced: parseInt(document.getElementById('enhancedPoints').value),
                    premium: parseInt(document.getElementById('premiumPoints').value)
                },
                features: {
                    enhancedTier: document.getElementById('enhancedTier').checked,
                    premiumTier: document.getElementById('premiumTier').checked
                }
            };

            if (window.Twitch) {
                await Twitch.ext.configuration.set('broadcaster', '1', JSON.stringify(newConfig));
                this.showNotification('Settings saved successfully', 'success');
            } else {
                console.log('Configuration saved (local):', newConfig);
                this.showNotification('Settings saved (local testing)', 'success');
            }
            
            this.currentConfig = newConfig;
        } catch (error) {
            console.error('Error saving configuration:', error);
            this.showNotification('Error saving configuration', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';

            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConfigurationPanel();
});
