import apiService from '../services/apiService';
import privacyModal from './PrivacyModal';
import '../styles/opt-in-dialog.css';

class OptInDialog {
    constructor() {
        this.dialog = null;
        this.isVisible = false;
        this.userId = null;
        this.selectedTier = null;
        this.config = {
            rewards: {
                enhanced: 1000,
                premium: 2500
            }
        };
    }

    create() {
        this.dialog = document.createElement('div');
        this.dialog.className = 'opt-in-dialog';
        this.dialog.innerHTML = `
            <div class="opt-in-content">
                <div class="opt-in-header">
                    <h2>Customize Your Experience</h2>
                    <button class="close-button">&times;</button>
                </div>

                <div class="opt-in-body">
                    <div class="tier-selection">
                        <div class="tier-card basic">
                            <div class="tier-header">
                                <h3>Basic</h3>
                                <div class="tier-badge current">Current</div>
                            </div>
                            <div class="tier-features">
                                <ul>
                                    <li>View count tracking</li>
                                    <li>Basic chat features</li>
                                    <li>Channel interactions</li>
                                    <li>Standard experience</li>
                                </ul>
                            </div>
                            <div class="tier-footer">
                                <span class="status-text">Currently Active</span>
                            </div>
                        </div>

                        <div class="tier-card enhanced">
                            <div class="tier-header">
                                <h3>Enhanced</h3>
                                <div class="tier-badge reward">+${this.config.rewards.enhanced} Points</div>
                            </div>
                            <div class="tier-features">
                                <ul>
                                    <li>All Basic features</li>
                                    <li>Personalized experience</li>
                                    <li>Enhanced predictions</li>
                                    <li>Special chat features</li>
                                </ul>
                            </div>
                            <div class="tier-footer">
                                <button class="opt-in-button" data-tier="enhanced">
                                    Activate Enhanced
                                </button>
                            </div>
                        </div>

                        <div class="tier-card premium">
                            <div class="tier-header">
                                <h3>Premium</h3>
                                <div class="tier-badge reward">+${this.config.rewards.premium} Points</div>
                            </div>
                            <div class="tier-features">
                                <ul>
                                    <li>All Enhanced features</li>
                                    <li>Priority in polls</li>
                                    <li>Exclusive events access</li>
                                    <li>Beta feature testing</li>
                                </ul>
                            </div>
                            <div class="tier-footer">
                                <button class="opt-in-button" data-tier="premium">
                                    Activate Premium
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <div class="info-box">
                            <span class="info-icon">🔒</span>
                            <p>Your privacy is important! Check our <button class="link-button" id="privacyLink">privacy policy</button> to learn how we handle your data.</p>
                        </div>
                        <div class="info-box">
                            <span class="info-icon">✨</span>
                            <p>Earn channel points for supporting the channel experience!</p>
                        </div>
                    </div>
                </div>

                <div class="opt-in-footer">
                    <button class="cancel-button">Maybe Later</button>
                </div>
            </div>

            <div class="success-overlay" style="display: none;">
                <div class="success-content">
                    <div class="success-icon">✨</div>
                    <h3>Awesome Choice!</h3>
                    <p class="points-message">You've earned <span class="points-amount">1000</span> channel points!</p>
                    <button class="close-success">Got it!</button>
                </div>
            </div>
        `;

        this.attachEventListeners();
        return this.dialog;
    }

    attachEventListeners() {
        // Close button
        const closeButton = this.dialog.querySelector('.close-button');
        closeButton.addEventListener('click', () => this.hide());

        // Cancel button
        const cancelButton = this.dialog.querySelector('.cancel-button');
        cancelButton.addEventListener('click', () => this.hide());

        // Privacy link
        const privacyLink = this.dialog.querySelector('#privacyLink');
        privacyLink.addEventListener('click', () => {
            privacyModal.show();
        });

        // Opt-in buttons
        const optInButtons = this.dialog.querySelectorAll('.opt-in-button');
        optInButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tier = e.target.dataset.tier;
                this.handleOptIn(tier, button);
            });
        });

        // Success overlay close
        const closeSuccess = this.dialog.querySelector('.close-success');
        closeSuccess.addEventListener('click', () => {
            this.hideSuccessOverlay();
            this.hide();
        });

        // Close on background click
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.hide();
            }
        });
    }

    async handleOptIn(tier, button) {
      this.selectedTier = tier;
      button.textContent = 'Processing...';
      button.disabled = true;

      try {
          // Prepare opt-in data
          const optInData = {
              tier: tier,
              notifications: true, // Could be customized in the dialog
              dataCollection: true,
              features: {
                  basic: true,
                  enhanced: tier === 'enhanced' || tier === 'premium',
                  premium: tier === 'premium'
              }
          };

          // Send opt-in data to backend
          const result = await apiService.captureViewerOptIn(optInData);

          if (result.success) {
              const points = this.config.rewards[tier];
              this.showSuccessOverlay(points);

              // Update button state
              button.textContent = 'Activated ✓';
              button.classList.add('success');

              // Record interaction
              await apiService.recordInteraction({
                  type: 'opt-in',
                  details: {
                      tier: tier,
                      points: points
                  }
              });

              // Emit custom event for parent components
              const event = new CustomEvent('tierActivated', {
                  detail: { tier, points }
              });
              document.dispatchEvent(event);
          } else {
              throw new Error('Opt-in failed');
          }

      } catch (error) {
          console.error('Error during opt-in:', error);
          button.textContent = 'Error - Try Again';
          button.disabled = false;
      }
  }

    showSuccessOverlay(points) {
        const overlay = this.dialog.querySelector('.success-overlay');
        const pointsAmount = overlay.querySelector('.points-amount');
        pointsAmount.textContent = points;
        overlay.style.display = 'flex';
    }

    hideSuccessOverlay() {
        const overlay = this.dialog.querySelector('.success-overlay');
        overlay.style.display = 'none';
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.dialog) {
            const enhancedBadge = this.dialog.querySelector('.enhanced .tier-badge');
            const premiumBadge = this.dialog.querySelector('.premium .tier-badge');
            
            if (enhancedBadge) {
                enhancedBadge.textContent = `+${this.config.rewards.enhanced} Points`;
            }
            if (premiumBadge) {
                premiumBadge.textContent = `+${this.config.rewards.premium} Points`;
            }
        }
    }

    show() {
        if (!this.isVisible) {
            document.body.appendChild(this.create());
            this.isVisible = true;
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.isVisible && this.dialog) {
            document.body.removeChild(this.dialog);
            this.isVisible = false;
            document.body.style.overflow = '';
        }
    }
}

export default new OptInDialog();
