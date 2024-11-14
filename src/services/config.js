class ConfigService {
  constructor() {
    this.config = {
      pointsEnabled: false,
      rewardAmounts: {
        enhanced: 1000,
        premium: 2500,
        monthly: 500
      }
    };
    
    // Listen for configuration changes
    Twitch.ext.configuration.onChanged(() => {
      this.updateConfig();
    });
  }

  updateConfig() {
    try {
      // Get broadcaster configuration
      const broadcasterConfig = JSON.parse(Twitch.ext.configuration.broadcaster?.content || '{}');
      
      // Update local config
      this.config = {
        ...this.config,
        ...broadcasterConfig
      };
      
      // Emit config update event
      const event = new CustomEvent('configUpdate', { detail: this.config });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Error updating configuration:', error);
    }
  }

  isPointsEnabled() {
    return this.config.pointsEnabled;
  }

  getRewardAmount(tier) {
    return this.config.rewardAmounts[tier] || 0;
  }
}

export default new ConfigService();
