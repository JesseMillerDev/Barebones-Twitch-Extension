class PrivacyModal {
    constructor() {
        this.modal = null;
        this.isVisible = false;
    }

    create() {
        this.modal = document.createElement('div');
        this.modal.className = 'privacy-modal';
        this.modal.innerHTML = `
            <div class="privacy-modal-content">
                <div class="privacy-modal-header">
                    <h2>Privacy Settings & Data Collection</h2>
                    <button class="close-button">&times;</button>
                </div>
                
                <div class="privacy-modal-body">
                    <div class="privacy-section">
                        <h3>Data Collection Tiers</h3>
                        
                        <div class="tier-info">
                            <h4>Basic Tier (Default)</h4>
                            <ul>
                                <li>View count statistics</li>
                                <li>Public chat messages</li>
                                <li>Channel interaction data</li>
                                <li>Subscription status</li>
                            </ul>
                            <div class="tier-badge">Active</div>
                        </div>

                        <div class="tier-info">
                            <h4>Enhanced Tier</h4>
                            <ul>
                                <li>Country-level location</li>
                                <li>Language preferences</li>
                                <li>Viewing schedule</li>
                                <li>Device type information</li>
                            </ul>
                            <button class="opt-in-button" data-tier="enhanced">Opt In</button>
                        </div>

                        <div class="tier-info">
                            <h4>Premium Tier</h4>
                            <ul>
                                <li>Detailed viewing patterns</li>
                                <li>Content preferences</li>
                                <li>Cross-channel activity</li>
                                <li>Enhanced personalization</li>
                            </ul>
                            <button class="opt-in-button" data-tier="premium">Opt In</button>
                        </div>
                    </div>

                    <div class="privacy-section">
                        <h3>Your Privacy Controls</h3>
                        <div class="privacy-controls">
                            <button id="downloadData" class="secondary-button">
                                <span class="icon">📥</span>
                                Download My Data
                            </button>
                            <button id="deleteData" class="danger-button">
                                <span class="icon">🗑️</span>
                                Delete My Data
                            </button>
                        </div>
                    </div>

                    <div class="privacy-section">
                        <h3>Data Protection</h3>
                        <div class="protection-info">
                            <p>Your data is:</p>
                            <ul>
                                <li>Encrypted during transmission and storage</li>
                                <li>Never shared with third parties</li>
                                <li>Automatically deleted after 90 days of inactivity</li>
                                <li>Only used to enhance your viewing experience</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        return this.modal;
    }

    attachEventListeners() {
        // Close button
        const closeButton = this.modal.querySelector('.close-button');
        closeButton.addEventListener('click', () => this.hide());

        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Opt-in buttons
        const optInButtons = this.modal.querySelectorAll('.opt-in-button');
        optInButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tier = e.target.dataset.tier;
                this.handleOptIn(tier, button);
            });
        });

        // Download data button
        const downloadButton = this.modal.querySelector('#downloadData');
        downloadButton.addEventListener('click', () => this.handleDataDownload());

        // Delete data button
        const deleteButton = this.modal.querySelector('#deleteData');
        deleteButton.addEventListener('click', () => this.handleDataDeletion());
    }

    handleOptIn(tier, button) {
        // Simulate opt-in process
        button.textContent = 'Processing...';
        button.disabled = true;

        setTimeout(() => {
            button.textContent = 'Opted In ✓';
            button.classList.add('success');
            this.showNotification(`Successfully opted in to ${tier} tier`);
        }, 1000);
    }

    async handleDataDownload() {
        this.showNotification('Preparing your data for download...');
        
        // Simulate data preparation
        setTimeout(() => {
            const dummyData = {
                userId: 'test-user',
                preferences: {},
                viewingHistory: [],
                timestamp: new Date().toISOString()
            };

            const dataStr = JSON.stringify(dummyData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'my-viewer-data.json';

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            this.showNotification('Data downloaded successfully!');
        }, 1500);
    }

    handleDataDeletion() {
        if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
            // Simulate deletion process
            this.showNotification('Deleting your data...', 'warning');
            
            setTimeout(() => {
                this.showNotification('Your data has been deleted', 'success');
            }, 2000);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `privacy-notification ${type}`;
        notification.textContent = message;

        this.modal.querySelector('.privacy-modal-content').appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    show() {
        if (!this.isVisible) {
            document.body.appendChild(this.create());
            this.isVisible = true;
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.isVisible && this.modal) {
            document.body.removeChild(this.modal);
            this.isVisible = false;
            document.body.style.overflow = '';
        }
    }
}

export default new PrivacyModal();
