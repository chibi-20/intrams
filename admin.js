// JZGMNHS Intramurals 2025 Admin Panel JavaScript
class IntramuralsAdmin {
    constructor() {
        this.data = null;
        this.currentSport = 'all';
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.displayMedalEditor();
            this.displaySportResults();
            this.generateJSON();
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            this.showError('Failed to load intramurals data');
        }
    }

    async loadData() {
        try {
            // First, try to load from localStorage (most recent data)
            const localData = localStorage.getItem('intramurals_data');
            if (localData) {
                this.data = JSON.parse(localData);
                console.log('Loaded data from localStorage');
                return;
            }

            // Fallback to loading from JSON file
            const response = await fetch('intramurals_data.json?t=' + Date.now());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            console.log('Loaded data from JSON file');
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to default structure
            this.data = {
                "grades": {
                    "grade-7": { "name": "Grade 7", "gold": 0, "silver": 0, "bronze": 0, "total": 0 },
                    "grade-8": { "name": "Grade 8", "gold": 0, "silver": 0, "bronze": 0, "total": 0 },
                    "grade-9": { "name": "Grade 9", "gold": 0, "silver": 0, "bronze": 0, "total": 0 },
                    "grade-10": { "name": "Grade 10", "gold": 0, "silver": 0, "bronze": 0, "total": 0 }
                },
                "sports": {},
                "medalValues": { "gold": 3, "silver": 2, "bronze": 1 },
                "lastUpdated": new Date().toISOString()
            };
        }
    }

    setupEventListeners() {
        // Tab switching
        const tabButtons = document.querySelectorAll('.admin-tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const sport = e.target.closest('.admin-tab-btn').dataset.sport;
                this.switchSport(sport);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveMedals();
            }
        });
    }

    switchSport(sport) {
        if (this.currentSport === sport) return;

        this.currentSport = sport;
        
        // Update active tab
        document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-sport="${sport}"]`).classList.add('active');

        // Update display
        this.displayMedalEditor();
        this.displaySportResults();
    }

    displayMedalEditor() {
        const container = document.getElementById('medal-tally-editor');
        
        container.innerHTML = `
            <div class="medal-editor-grid">
                <table class="medal-editor-table">
                    <thead>
                        <tr>
                            <th>Grade Level</th>
                            <th class="gold-header"><i class="fas fa-medal gold-medal"></i> Gold</th>
                            <th class="silver-header"><i class="fas fa-medal silver-medal"></i> Silver</th>
                            <th class="bronze-header"><i class="fas fa-medal bronze-medal"></i> Bronze</th>
                            <th>Total</th>
                            <th>Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(this.data.grades).map(gradeKey => {
                            const grade = this.data.grades[gradeKey];
                            const totalMedals = grade.gold + grade.silver + grade.bronze;
                            const totalScore = (grade.gold * this.data.medalValues.gold) + 
                                             (grade.silver * this.data.medalValues.silver) + 
                                             (grade.bronze * this.data.medalValues.bronze);
                            
                            return `
                                <tr class="grade-editor-row">
                                    <td class="grade-name-cell">
                                        <strong>${grade.name}</strong>
                                    </td>
                                    <td class="medal-input-cell">
                                        <input type="number" class="medal-input gold" min="0" 
                                               value="${grade.gold}" 
                                               data-grade="${gradeKey}" 
                                               data-medal="gold">
                                    </td>
                                    <td class="medal-input-cell">
                                        <input type="number" class="medal-input silver" min="0" 
                                               value="${grade.silver}" 
                                               data-grade="${gradeKey}" 
                                               data-medal="silver">
                                    </td>
                                    <td class="medal-input-cell">
                                        <input type="number" class="medal-input bronze" min="0" 
                                               value="${grade.bronze}" 
                                               data-grade="${gradeKey}" 
                                               data-medal="bronze">
                                    </td>
                                    <td class="total-cell">
                                        <span class="total-medals">${totalMedals}</span>
                                    </td>
                                    <td class="score-cell">
                                        <span class="total-score">${totalScore}</span>
                                    </td>
                                    <td class="actions-cell">
                                        <button class="btn btn-sm btn-success" onclick="addMedal('${gradeKey}', 'gold')">
                                            <i class="fas fa-plus"></i> Gold
                                        </button>
                                        <button class="btn btn-sm btn-warning" onclick="resetGrade('${gradeKey}')">
                                            <i class="fas fa-undo"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Add event listeners to medal inputs
        container.querySelectorAll('.medal-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateMedalCount(e.target.dataset.grade, e.target.dataset.medal, e.target.value);
            });
            
            // Also listen for input events for real-time updates
            input.addEventListener('input', (e) => {
                this.updateMedalCount(e.target.dataset.grade, e.target.dataset.medal, e.target.value);
            });
        });
    }

    displaySportResults() {
        const container = document.getElementById('sport-results-container');
        
        if (this.currentSport === 'all') {
            // Show all sports overview grouped by subcategory
            const subcategoryGroups = {};
            Object.keys(this.data.sports).forEach(sportKey => {
                const sport = this.data.sports[sportKey];
                const subcategory = sport.subcategory || 'Other';
                if (!subcategoryGroups[subcategory]) {
                    subcategoryGroups[subcategory] = [];
                }
                subcategoryGroups[subcategory].push({ key: sportKey, ...sport });
            });

            container.innerHTML = `
                <div class="sports-overview">
                    <h3>All Sports Events</h3>
                    ${Object.entries(subcategoryGroups).map(([subcategory, sports]) => {
                        return `
                            <div class="subcategory-section">
                                <h4 class="subcategory-title">${subcategory}</h4>
                                <div class="sports-grid">
                                    ${sports.map(sport => {
                                        const hasResults = sport.results && sport.results.length > 0;
                                        const genderLabel = sport.gender && sport.gender !== 'Mixed' ? ` (${sport.gender})` : '';
                                        
                                        return `
                                            <div class="sport-overview-card ${hasResults ? 'completed' : 'pending'}">
                                                <div class="sport-header">
                                                    <i class="${sport.icon}"></i>
                                                    <h5>${sport.name}${genderLabel}</h5>
                                                </div>
                                                <div class="sport-status">
                                                    ${hasResults ? `
                                                        <div class="completed-status">
                                                            <i class="fas fa-check-circle"></i>
                                                            Completed
                                                        </div>
                                                    ` : `
                                                        <div class="pending-status">
                                                            <i class="fas fa-clock"></i>
                                                            Pending
                                                        </div>
                                                    `}
                                                </div>
                                                <button class="btn btn-sm btn-primary" onclick="editSport('${sport.key}')">
                                                    <i class="fas fa-edit"></i>
                                                    ${hasResults ? 'Edit' : 'Add'} Results
                                                </button>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            // Show specific sport category
            this.displayCategorySports(container);
        }
    }

    displayCategorySports(container) {
        const categoryMap = {
            'team-sports': 'Team Sports',
            'athletics': 'Athletics', // Updated for Athletics
            'individual-dual-sports': 'Individual/Dual Sports',
            'e-sports': 'E-Sports',
            'martial-arts': 'Martial Arts',
            'creative-arts': 'Creative Arts'
        };

        const categoryName = categoryMap[this.currentSport] || 'All Sports';
        const sportsInCategory = Object.keys(this.data.sports).filter(sportKey => {
            const sport = this.data.sports[sportKey];
            if (this.currentSport === 'athletics') {
                // For Athletics tab, show only athletics events
                return sport.subcategory === 'Athletics';
            } else if (this.currentSport === 'individual-dual-sports') {
                // For Individual/Dual Sports tab, show all individual sports except athletics
                return sport.category === 'Individual Sports' && sport.subcategory !== 'Athletics';
            } else {
                // For other tabs, use normal category matching
                return sport.category === categoryName;
            }
        });

        // Group sports by subcategory
        const subcategoryGroups = {};
        sportsInCategory.forEach(sportKey => {
            const sport = this.data.sports[sportKey];
            const subcategory = sport.subcategory || 'Other';
            if (!subcategoryGroups[subcategory]) {
                subcategoryGroups[subcategory] = [];
            }
            subcategoryGroups[subcategory].push({ key: sportKey, ...sport });
        });

        container.innerHTML = `
            <div class="category-sports">
                <h3>${categoryName} Events</h3>
                ${Object.entries(subcategoryGroups).map(([subcategory, sports]) => {
                    return `
                        <div class="subcategory-section">
                            <h4 class="subcategory-title">${subcategory}</h4>
                            <div class="sport-results-list">
                                ${sports.map(sport => {
                                    return this.createSportResultEditor(sport.key, sport);
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    createSportResultEditor(sportKey, sport) {
        const genderLabel = sport.gender && sport.gender !== 'Mixed' ? ` (${sport.gender})` : '';
        
        return `
            <div class="sport-result-editor" data-sport="${sportKey}">
                <div class="sport-result-header">
                    <div class="sport-title">
                        <i class="${sport.icon}"></i>
                        <h4>${sport.name}${genderLabel}</h4>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="clearSportResults('${sportKey}')">
                        <i class="fas fa-trash"></i>
                        Clear
                    </button>
                </div>
                
                <div class="medal-positions">
                    <div class="position-editor gold-position">
                        <label><i class="fas fa-medal gold-medal"></i> Gold (1st Place)</label>
                        <select class="position-select" data-sport="${sportKey}" data-position="1">
                            <option value="">Select Grade</option>
                            <option value="Grade 7" ${this.getSelectedGrade(sport, 1) === 'Grade 7' ? 'selected' : ''}>Grade 7</option>
                            <option value="Grade 8" ${this.getSelectedGrade(sport, 1) === 'Grade 8' ? 'selected' : ''}>Grade 8</option>
                            <option value="Grade 9" ${this.getSelectedGrade(sport, 1) === 'Grade 9' ? 'selected' : ''}>Grade 9</option>
                            <option value="Grade 10" ${this.getSelectedGrade(sport, 1) === 'Grade 10' ? 'selected' : ''}>Grade 10</option>
                        </select>
                    </div>
                    
                    <div class="position-editor silver-position">
                        <label><i class="fas fa-medal silver-medal"></i> Silver (2nd Place)</label>
                        <select class="position-select" data-sport="${sportKey}" data-position="2">
                            <option value="">Select Grade</option>
                            <option value="Grade 7" ${this.getSelectedGrade(sport, 2) === 'Grade 7' ? 'selected' : ''}>Grade 7</option>
                            <option value="Grade 8" ${this.getSelectedGrade(sport, 2) === 'Grade 8' ? 'selected' : ''}>Grade 8</option>
                            <option value="Grade 9" ${this.getSelectedGrade(sport, 2) === 'Grade 9' ? 'selected' : ''}>Grade 9</option>
                            <option value="Grade 10" ${this.getSelectedGrade(sport, 2) === 'Grade 10' ? 'selected' : ''}>Grade 10</option>
                        </select>
                    </div>
                    
                    <div class="position-editor bronze-position">
                        <label><i class="fas fa-medal bronze-medal"></i> Bronze (3rd Place)</label>
                        <select class="position-select" data-sport="${sportKey}" data-position="3">
                            <option value="">Select Grade</option>
                            <option value="Grade 7" ${this.getSelectedGrade(sport, 3) === 'Grade 7' ? 'selected' : ''}>Grade 7</option>
                            <option value="Grade 8" ${this.getSelectedGrade(sport, 3) === 'Grade 8' ? 'selected' : ''}>Grade 8</option>
                            <option value="Grade 9" ${this.getSelectedGrade(sport, 3) === 'Grade 9' ? 'selected' : ''}>Grade 9</option>
                            <option value="Grade 10" ${this.getSelectedGrade(sport, 3) === 'Grade 10' ? 'selected' : ''}>Grade 10</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    getSelectedGrade(sport, position) {
        if (!sport.results) return '';
        const result = sport.results.find(r => r.position === position);
        return result ? result.grade : '';
    }

    updateMedalCount(gradeKey, medalType, value) {
        this.data.grades[gradeKey][medalType] = parseInt(value) || 0;
        
        // Auto-save on every medal change
        this.data.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        this.broadcastUpdate();
        
        this.displayMedalEditor(); // Refresh to show updated totals
        this.generateJSON();
        this.showQuickSuccess('Medals updated!');
    }

    addMedal(gradeKey, medalType) {
        this.data.grades[gradeKey][medalType]++;
        
        // Auto-save on medal addition
        this.data.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        this.broadcastUpdate();
        
        this.displayMedalEditor();
        this.generateJSON();
        this.showSuccess(`Added ${medalType} medal to ${this.data.grades[gradeKey].name}!`);
    }

    resetGrade(gradeKey) {
        this.data.grades[gradeKey].gold = 0;
        this.data.grades[gradeKey].silver = 0;
        this.data.grades[gradeKey].bronze = 0;
        this.displayMedalEditor();
        this.generateJSON();
        this.showSuccess(`Reset medals for ${this.data.grades[gradeKey].name}!`);
    }

    resetAllMedals() {
        Object.keys(this.data.grades).forEach(gradeKey => {
            this.data.grades[gradeKey].gold = 0;
            this.data.grades[gradeKey].silver = 0;
            this.data.grades[gradeKey].bronze = 0;
        });
        
        Object.keys(this.data.sports).forEach(sportKey => {
            this.data.sports[sportKey].results = [];
        });
        
        this.displayMedalEditor();
        this.displaySportResults();
        this.generateJSON();
        this.showSuccess('All medals and results reset!');
    }

    saveMedals() {
        // Recalculate medals before saving
        this.recalculateMedals();
        
        // Update timestamp
        this.data.lastUpdated = new Date().toISOString();
        
        // Save to localStorage for persistence
        this.saveToStorage();
        
        // Generate JSON for download
        this.generateJSON();
        
        // Show success message
        this.showSuccess('Changes saved successfully! Data updated.');
        
        // Notify any listening windows/tabs about the update
        this.broadcastUpdate();
    }

    saveToStorage() {
        try {
            localStorage.setItem('intramurals_data', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    broadcastUpdate() {
        // Use BroadcastChannel to notify other tabs/windows
        try {
            const channel = new BroadcastChannel('intramurals_updates');
            channel.postMessage({
                type: 'data_updated',
                timestamp: this.data.lastUpdated,
                data: this.data
            });
            channel.close();
        } catch (error) {
            console.log('BroadcastChannel not supported, using localStorage events');
            // Fallback: trigger storage event
            localStorage.setItem('intramurals_update_trigger', Date.now().toString());
        }
    }

    updateSportResult(sportKey, position, grade) {
        if (!this.data.sports[sportKey].results) {
            this.data.sports[sportKey].results = [];
        }

        // Remove existing result for this position
        this.data.sports[sportKey].results = this.data.sports[sportKey].results.filter(r => r.position !== parseInt(position));

        // Add new result if grade is selected
        if (grade) {
            this.data.sports[sportKey].results.push({
                position: parseInt(position),
                grade: grade
            });
        }

        // Update medal tallies and save automatically
        this.recalculateMedals();
        this.data.lastUpdated = new Date().toISOString();
        this.saveToStorage();
        this.broadcastUpdate();
        this.generateJSON();
        
        // Show subtle feedback
        this.showQuickSuccess('Medal updated!');
    }

    showQuickSuccess(message) {
        // Remove any existing quick notifications
        const existing = document.querySelector('.quick-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'quick-notification';
        notification.innerHTML = `<i class="fas fa-check"></i> ${message}`;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            font-size: 0.9rem;
            z-index: 1001;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2000);
    }

    recalculateMedals() {
        // Reset all medal counts
        Object.keys(this.data.grades).forEach(gradeKey => {
            this.data.grades[gradeKey].gold = 0;
            this.data.grades[gradeKey].silver = 0;
            this.data.grades[gradeKey].bronze = 0;
        });

        // Count medals from sport results
        Object.values(this.data.sports).forEach(sport => {
            if (sport.results) {
                sport.results.forEach(result => {
                    const gradeKey = `grade-${result.grade.split(' ')[1]}`;
                    if (this.data.grades[gradeKey]) {
                        switch (result.position) {
                            case 1:
                                this.data.grades[gradeKey].gold++;
                                break;
                            case 2:
                                this.data.grades[gradeKey].silver++;
                                break;
                            case 3:
                                this.data.grades[gradeKey].bronze++;
                                break;
                        }
                    }
                });
            }
        });

        this.displayMedalEditor();
    }

    clearSportResults(sportKey) {
        this.data.sports[sportKey].results = [];
        this.recalculateMedals();
        this.displaySportResults();
        this.generateJSON();
        this.showSuccess(`Cleared results for ${this.data.sports[sportKey].name}!`);
    }

    generateJSON() {
        this.data.lastUpdated = new Date().toISOString();
        const jsonOutput = document.getElementById('json-output');
        if (jsonOutput) {
            jsonOutput.textContent = JSON.stringify(this.data, null, 2);
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Global functions
let adminInstance;

function addMedal(gradeKey, medalType) {
    if (adminInstance) {
        adminInstance.addMedal(gradeKey, medalType);
    }
}

function resetGrade(gradeKey) {
    if (adminInstance) {
        adminInstance.resetGrade(gradeKey);
    }
}

function resetAllMedals() {
    if (adminInstance) {
        adminInstance.resetAllMedals();
    }
}

function saveMedals() {
    if (adminInstance) {
        adminInstance.saveMedals();
    }
}

function editSport(sportKey) {
    if (adminInstance) {
        adminInstance.switchSport('athletics');
        // Focus on the specific sport
    }
}

function clearSportResults(sportKey) {
    if (adminInstance) {
        adminInstance.clearSportResults(sportKey);
    }
}

function copyJSON() {
    const jsonOutput = document.getElementById('json-output');
    if (jsonOutput) {
        navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
            if (adminInstance) {
                adminInstance.showSuccess('JSON copied to clipboard!');
            }
        });
    }
}

function downloadJSON() {
    const jsonOutput = document.getElementById('json-output');
    if (jsonOutput) {
        const blob = new Blob([jsonOutput.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'intramurals-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (adminInstance) {
            adminInstance.showSuccess('JSON file downloaded!');
        }
    }
}

function exportData() {
    downloadJSON();
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        background: linear-gradient(135deg, #28a745, #20c997);
    }
    
    .notification.error {
        background: linear-gradient(135deg, #dc3545, #fd7e14);
    }

    .gold-medal { color: #FFD700; }
    .silver-medal { color: #C0C0C0; }
    .bronze-medal { color: #CD7F32; }
    
    .medal-input.gold { border-left: 4px solid #FFD700; }
    .medal-input.silver { border-left: 4px solid #C0C0C0; }
    .medal-input.bronze { border-left: 4px solid #CD7F32; }
    
    .sport-overview-card.completed {
        border-left: 4px solid #28a745;
    }
    
    .sport-overview-card.pending {
        border-left: 4px solid #ffc107;
    }
    
    .sports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
    }
    
    .position-editor {
        margin-bottom: 1rem;
    }
    
    .position-editor label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
    
    .position-select {
        width: 100%;
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid rgba(255, 107, 53, 0.3);
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
    }
`;
document.head.appendChild(style);

// Initialize the admin panel when the page loads
document.addEventListener('DOMContentLoaded', () => {
    adminInstance = new IntramuralsAdmin();
    
    // Add event delegation for position selects
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('position-select')) {
            adminInstance.updateSportResult(
                e.target.dataset.sport,
                e.target.dataset.position,
                e.target.value
            );
        }
    });
});
