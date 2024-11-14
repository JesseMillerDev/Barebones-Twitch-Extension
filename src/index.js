import './style.css';
import privacyModal from './components/PrivacyModal';
import optInDialog from './components/OptInDialog';
import apiService from './services/apiService';
import './styles/privacy-modal.css';
import './styles/opt-in-dialog.css';

class ViewerPage {
  constructor() {
    this.sessionStart = new Date();
    this.interactions = [];
    this.featuresUsed = new Set();
    
    // Set up heartbeat interval
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 60000);
    
    // Listen for page unload
    window.addEventListener('beforeunload', () => this.handleUnload());

    this.config = {
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
  
    this.render();

    // Add Twitch auth after render
    if (window.Twitch) {
      console.log('Twitch environment detected');
      Twitch.ext.onAuthorized((auth) => {
        console.log('Twitch Auth Received:', auth);
        this.updateUserInfo(auth.userId);
      });

      // Listen for tier activation events
      document.addEventListener('tierActivated', (event) => {
        console.log('Tier activated:', event.detail);
        this.handleTierActivation(event.detail);
      });
    }
  }

  updateUserInfo(userId) {
    const debugInfo = document.createElement('div');
    debugInfo.className = 'debug-info';
    debugInfo.style.cssText = 'margin-top: 20px; font-size: 12px; color: #666;';
    debugInfo.textContent = `User ID: ${userId}`;
    document.querySelector('.viewer-panel').appendChild(debugInfo);
  }

  handleTierActivation(detail) {
    const { tier, points } = detail;
    
    // Update UI to reflect new tier
    const tierBadge = document.getElementById('tierBadge');
    if (tierBadge) {
      tierBadge.textContent = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`;
      tierBadge.className = `status-badge ${tier}`;
    }

    // Record feature usage
    this.featuresUsed.add(detail.tier);
        
    // Record interaction
    this.recordInteraction('tier-activation', detail);

    // Show points notification
    this.showPointsNotification(points);

    // Update feature item status
    const featureItem = document.getElementById(`${tier}Features`);
    if (featureItem) {
      const unlockButton = featureItem.querySelector('.unlock-button');
      if (unlockButton) {
        unlockButton.textContent = 'Unlocked ✓';
        unlockButton.disabled = true;
      }
      featureItem.classList.remove('locked');
      featureItem.classList.add('active');
    }
  }
  
  recordInteraction(type, details) {
        const interaction = {
            type,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.interactions.push(interaction);
        apiService.recordInteraction(interaction);
    }

    async sendHeartbeat() {
        try {
            await apiService.sendHeartbeat({
                active: document.visibilityState === 'visible',
                features: Array.from(this.featuresUsed),
                lastInteraction: this.interactions[this.interactions.length - 1]?.timestamp
            });
        } catch (error) {
            console.error('Failed to send heartbeat:', error);
        }
    }

    handleUnload() {
        const sessionEnd = {
            duration: new Date() - this.sessionStart,
            interactions: this.interactions,
            featuresUsed: Array.from(this.featuresUsed)
        };

        // Use sendBeacon for more reliable delivery during page unload
        navigator.sendBeacon(
            `${apiService.baseUrl}/viewer/session/end`,
            JSON.stringify(sessionEnd)
        );
    }
    
  render() {
    console.log('Rendering viewer page');
    const container = document.createElement('div');
    container.className = 'viewer-container';
    container.innerHTML = `
      <div class="viewer-panel">
        <div class="viewer-header">
          <h2>Channel Experience</h2>
          <div class="status-badge" id="tierBadge">Basic Tier</div>
        </div>

        <div class="features-section">
          <h3>Available Features</h3>
          <div class="feature-list">
            <div class="feature-item active">
              <span class="feature-icon">📊</span>
              <div class="feature-details">
                <h4>Basic Analytics</h4>
                <p>View count and interaction tracking</p>
              </div>
              <span class="status-icon">✓</span>
            </div>

            <div class="feature-item locked" id="enhancedFeatures">
              <span class="feature-icon">⭐</span>
              <div class="feature-details">
                <h4>Enhanced Features</h4>
                <p>Personalized experience and rewards</p>
                <small class="points-reward">${this.config.rewards.enhanced} Channel Points</small>
              </div>
              <button class="unlock-button">Unlock</button>
            </div>

            <div class="feature-item locked" id="premiumFeatures">
              <span class="feature-icon">👑</span>
              <div class="feature-details">
                <h4>Premium Features</h4>
                <p>Priority access and exclusive content</p>
                <small class="points-reward">${this.config.rewards.premium} Channel Points</small>
              </div>
              <button class="unlock-button">Unlock</button>
            </div>
          </div>
        </div>

        <div class="actions-section">
          <button id="customizeButton" class="primary-button">
            Customize Experience
          </button>
          <button id="privacyButton" class="secondary-button">
            Privacy Settings
          </button>
        </div>

        <div class="points-info" id="pointsInfo" style="display: none;">
          <span class="points-icon">✨</span>
          <span class="points-text">You earned <strong>1000</strong> channel points!</span>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    console.log('Container added to body');
    this.attachEventListeners();
  }

  attachEventListeners() {
    console.log('Attaching event listeners');
    
    // Customize button
    const customizeButton = document.getElementById('customizeButton');
    if (customizeButton) {
      customizeButton.addEventListener('click', () => {
        console.log('Customize button clicked');
        optInDialog.updateConfig(this.config);
        optInDialog.show();
      });
    }

    // Privacy button
    const privacyButton = document.getElementById('privacyButton');
    if (privacyButton) {
      privacyButton.addEventListener('click', () => {
        console.log('Privacy button clicked');
        privacyModal.show();
      });
    }

    // Enhanced tier unlock button
    const enhancedButton = document.querySelector('#enhancedFeatures .unlock-button');
    if (enhancedButton) {
      enhancedButton.addEventListener('click', () => {
        console.log('Enhanced tier unlock clicked');
        optInDialog.updateConfig(this.config);
        optInDialog.show();
      });
    }

    // Premium tier unlock button
    const premiumButton = document.querySelector('#premiumFeatures .unlock-button');
    if (premiumButton) {
      premiumButton.addEventListener('click', () => {
        console.log('Premium tier unlock clicked');
        optInDialog.updateConfig(this.config);
        optInDialog.show();
      });
    }
  }

  showPointsNotification(amount) {
    const pointsInfo = document.getElementById('pointsInfo');
    if (pointsInfo) {
      const pointsText = pointsInfo.querySelector('.points-text strong');
      pointsText.textContent = amount;
      pointsInfo.style.display = 'flex';
      
      setTimeout(() => {
        pointsInfo.style.display = 'none';
      }, 5000);
    }
  }
}

// Initialize the viewer page when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  new ViewerPage();
});
