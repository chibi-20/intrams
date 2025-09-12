// JZGMNHS Intramurals 2025 Medal Tally JavaScript
class IntramuralsLeaderboard {
    constructor() {
        this.data = null;
        this.currentCategory = 'all';
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.displayMedalTally();
            this.updateStats();
            this.updateLastUpdated();
            this.startAutoRefresh();
            console.log('Intramurals leaderboard initialized successfully');
        } catch (error) {
            console.error('Error initializing intramurals:', error);
            this.showError('Failed to load intramurals data');
        }
    }

    async loadData() {
        try {
            // First check localStorage for most recent data
            const localData = localStorage.getItem('intramurals_data');
            if (localData) {
                const parsedData = JSON.parse(localData);
                this.data = parsedData;
                console.log('Loaded data from localStorage');
                return;
            }

            // Fallback to JSON file with cache busting
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
        // Category tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.closest('.tab-btn').dataset.category;
                this.switchCategory(category);
            });
        });

        // Admin panel shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                this.openAdminPanel();
            }
        });

        // Manual refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // Listen for real-time updates
        this.setupRealTimeUpdates();
    }

    setupRealTimeUpdates() {
        // Update connection status
        this.updateConnectionStatus(true);
        
        // Listen for BroadcastChannel updates (modern browsers)
        try {
            const channel = new BroadcastChannel('intramurals_updates');
            channel.addEventListener('message', (event) => {
                if (event.data.type === 'data_updated') {
                    console.log('Received real-time update');
                    this.data = event.data.data;
                    this.displayMedalTally();
                    this.updateStats();
                    this.updateLastUpdated();
                    this.showUpdateNotification();
                }
            });
        } catch (error) {
            console.log('BroadcastChannel not supported, using localStorage events');
        }

        // Fallback: Listen for localStorage changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'intramurals_data' || e.key === 'intramurals_update_trigger') {
                console.log('Detected localStorage update');
                this.refreshData();
                this.showUpdateNotification();
            }
        });

        // Also check for updates periodically (every 5 seconds)
        setInterval(() => {
            const localData = localStorage.getItem('intramurals_data');
            if (localData) {
                const parsedData = JSON.parse(localData);
                if (parsedData.lastUpdated !== this.data.lastUpdated) {
                    console.log('Detected data update via polling');
                    this.data = parsedData;
                    this.displayMedalTally();
                    this.updateStats();
                    this.updateLastUpdated();
                    this.showUpdateNotification();
                }
            }
        }, 5000);
    }

    updateConnectionStatus(connected) {
        const statusIcon = document.getElementById('connection-status');
        const statusText = document.getElementById('connection-text');
        
        if (statusIcon && statusText) {
            if (connected) {
                statusIcon.className = 'fas fa-wifi';
                statusIcon.style.color = '#4CAF50';
                statusText.textContent = 'Live Updates';
            } else {
                statusIcon.className = 'fas fa-wifi-slash';
                statusIcon.style.color = '#ff6b35';
                statusText.textContent = 'Offline Mode';
            }
        }
    }

    showUpdateNotification() {
        // Create a subtle notification
        const notification = document.createElement('div');
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>Data Updated</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 0.8rem 1.2rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            font-family: 'Rajdhani', sans-serif;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    async refreshData() {
        try {
            await this.loadData();
            this.displayMedalTally();
            this.updateStats();
            this.updateLastUpdated();
            this.showSuccess('Data refreshed!');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showError('Failed to refresh data');
        }
    }

    startAutoRefresh() {
        // Auto-refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 30000);
    }

    switchCategory(category) {
        if (this.currentCategory === category) return;

        this.currentCategory = category;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Update display
        this.displayMedalTally();
        this.updateSectionInfo();
    }

    updateSectionInfo() {
        const titleElement = document.getElementById('section-title');
        const descriptionElement = document.getElementById('section-description');
        
        if (!titleElement || !descriptionElement) return;

        switch (this.currentCategory) {
            case 'all':
                titleElement.textContent = 'Overall Medal Tally';
                descriptionElement.textContent = 'Grades 7-10 Medal Rankings';
                break;
            case 'team-sports':
                titleElement.textContent = 'Team Sports Results';
                descriptionElement.textContent = 'Basketball, Volleyball, Futsal, Sepak Takraw';
                break;
            case 'individual-sports':
                titleElement.textContent = 'Athletics Results';
                descriptionElement.textContent = 'Track and Field Events';
                break;
            case 'individual-dual-sports':
                titleElement.textContent = 'Individual/Dual Sports Results';
                descriptionElement.textContent = 'Arnis, Badminton, Table Tennis, Chess, Scrabble';
                break;
            case 'e-sports':
                titleElement.textContent = 'E-Sports Results';
                descriptionElement.textContent = 'Mobile Legends, CODM, Tekken 7, Valorant';
                break;
            case 'martial-arts':
                titleElement.textContent = 'Martial Arts Results';
                descriptionElement.textContent = 'Arnis, Boxing, Taekwondo, Wrestling';
                break;
            case 'creative-arts':
                titleElement.textContent = 'Creative Arts Results';
                descriptionElement.textContent = 'Banner Art, Banderitas Making Contest';
                break;
        }
    }

    displayMedalTally() {
        const container = document.getElementById('leaderboard-content');
        
        if (!this.data || !this.data.grades) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-info-circle"></i>
                    <h3>No data available</h3>
                    <p>Intramurals data will appear here once events are completed.</p>
                </div>
            `;
            return;
        }

        if (this.currentCategory === 'all') {
            this.displayOverallMedalTally(container);
        } else {
            this.displayCategoryResults(container);
        }
    }

    displayOverallMedalTally(container) {
        // Calculate total medals for each grade
        const grades = Object.keys(this.data.grades).map(gradeKey => {
            const grade = this.data.grades[gradeKey];
            const totalScore = (grade.gold * this.data.medalValues.gold) + 
                             (grade.silver * this.data.medalValues.silver) + 
                             (grade.bronze * this.data.medalValues.bronze);
            return {
                ...grade,
                key: gradeKey,
                totalScore
            };
        });

        // Sort by total score, then gold, then silver, then bronze
        grades.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            if (b.gold !== a.gold) return b.gold - a.gold;
            if (b.silver !== a.silver) return b.silver - a.silver;
            return b.bronze - a.bronze;
        });

        container.innerHTML = `
            <div class="medal-tally-container">
                <table class="medal-table">
                    <thead>
                        <tr>
                            <th class="rank-header">Rank</th>
                            <th class="grade-header">Grade Level</th>
                            <th class="gold-header"><i class="fas fa-medal gold-medal"></i> Gold</th>
                            <th class="silver-header"><i class="fas fa-medal silver-medal"></i> Silver</th>
                            <th class="bronze-header"><i class="fas fa-medal bronze-medal"></i> Bronze</th>
                            <th class="total-header">Total</th>
                            <th class="score-header">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grades.map((grade, index) => {
                            const totalMedals = grade.gold + grade.silver + grade.bronze;
                            return `
                                <tr class="grade-row ${this.getRankClass(index)}">
                                    <td class="rank-cell">
                                        <div class="rank-badge rank-${index + 1}">
                                            ${this.getRankIcon(index)}
                                            <span class="rank-number">${index + 1}</span>
                                        </div>
                                    </td>
                                    <td class="grade-cell">
                                        <div class="grade-info">
                                            <span class="grade-name">${grade.name}</span>
                                        </div>
                                    </td>
                                    <td class="medal-cell gold">
                                        <span class="medal-count">${grade.gold}</span>
                                    </td>
                                    <td class="medal-cell silver">
                                        <span class="medal-count">${grade.silver}</span>
                                    </td>
                                    <td class="medal-cell bronze">
                                        <span class="medal-count">${grade.bronze}</span>
                                    </td>
                                    <td class="total-cell">
                                        <span class="total-medals">${totalMedals}</span>
                                    </td>
                                    <td class="score-cell">
                                        <span class="total-score">${grade.totalScore}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayCategoryResults(container) {
        const categoryMap = {
            'team-sports': 'Team Sports',
            'individual-sports': 'Athletics', // Special handling for Athletics
            'individual-dual-sports': 'Individual/Dual Sports',
            'e-sports': 'E-Sports',
            'martial-arts': 'Martial Arts',
            'creative-arts': 'Creative Arts'
        };

        const categoryName = categoryMap[this.currentCategory];
        
        // Special filtering for Athletics tab
        const sportsInCategory = Object.keys(this.data.sports).filter(sportKey => {
            const sport = this.data.sports[sportKey];
            
            if (this.currentCategory === 'individual-sports') {
                // For Athletics tab, show only athletics events
                return sport.subcategory === 'Athletics';
            } else if (this.currentCategory === 'individual-dual-sports') {
                // For Individual/Dual Sports tab, show individual/dual sports
                return sport.category === 'Individual/Dual Sports';
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
            <div class="category-results-container">
                ${Object.entries(subcategoryGroups).map(([subcategory, sports]) => {
                    return `
                        <div class="subcategory-section">
                            <h2 class="subcategory-title">${subcategory}</h2>
                            <div class="sports-grid">
                                ${sports.map(sport => {
                                    const genderLabel = sport.gender && sport.gender !== 'Mixed' ? ` (${sport.gender})` : '';
                                    return `
                                        <div class="sport-card">
                                            <div class="sport-header">
                                                <i class="${sport.icon}"></i>
                                                <h3>${sport.name}${genderLabel}</h3>
                                            </div>
                                            <div class="sport-results">
                                                ${sport.results.length > 0 ? `
                                                    <div class="medal-winners">
                                                        <div class="gold-winner">
                                                            <i class="fas fa-medal gold-medal"></i>
                                                            <span>${sport.results.find(r => r.position === 1)?.grade || 'TBD'}</span>
                                                        </div>
                                                        <div class="silver-winner">
                                                            <i class="fas fa-medal silver-medal"></i>
                                                            <span>${sport.results.find(r => r.position === 2)?.grade || 'TBD'}</span>
                                                        </div>
                                                        <div class="bronze-winner">
                                                            <i class="fas fa-medal bronze-medal"></i>
                                                            <span>${sport.results.find(r => r.position === 3)?.grade || 'TBD'}</span>
                                                        </div>
                                                    </div>
                                                ` : `
                                                    <div class="no-results">
                                                        <i class="fas fa-clock"></i>
                                                        <span>Event Pending</span>
                                                    </div>
                                                `}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    getRankClass(index) {
        switch (index) {
            case 0: return 'first-place';
            case 1: return 'second-place';
            case 2: return 'third-place';
            default: return '';
        }
    }

    getRankIcon(index) {
        switch (index) {
            case 0: return '<i class="fas fa-crown"></i>';
            case 1: return '<i class="fas fa-medal"></i>';
            case 2: return '<i class="fas fa-award"></i>';
            default: return '';
        }
    }

    updateStats() {
        const totalGrades = Object.keys(this.data.grades).length;
        const totalSports = Object.keys(this.data.sports).length;
        const completedEvents = Object.values(this.data.sports).filter(sport => sport.results.length > 0).length;

        // Update info cards
        const totalGradesElement = document.getElementById('total-grades');
        const totalEventsElement = document.getElementById('total-events');
        
        if (totalGradesElement) {
            totalGradesElement.textContent = `${totalGrades} Grade Levels`;
        }
        
        if (totalEventsElement) {
            totalEventsElement.textContent = `${totalSports} Events`;
        }

        // Update stats grid if exists
        const statsContainer = document.querySelector('.tournament-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${totalGrades}</div>
                        <div class="stat-label">Grade Levels</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-medal"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${totalSports}</div>
                        <div class="stat-label">Total Events</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${completedEvents}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${this.data.medalValues.gold}</div>
                        <div class="stat-label">Gold Value</div>
                    </div>
                </div>
            `;
        }
    }

    updateLastUpdated() {
        const lastUpdatedElement = document.querySelector('.last-updated');
        if (lastUpdatedElement && this.data.lastUpdated) {
            const date = new Date(this.data.lastUpdated);
            const formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            lastUpdatedElement.textContent = `Last updated: ${formattedDate}`;
        }
    }

    openAdminPanel() {
        window.open('admin.html', '_blank', 'width=1200,height=800');
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

// Initialize the intramurals leaderboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new IntramuralsLeaderboard();
});

// Add medal-specific styles
const style = document.createElement('style');
style.textContent = `
    .gold-medal { color: #FFD700; }
    .silver-medal { color: #C0C0C0; }
    .bronze-medal { color: #CD7F32; }
    
    .medal-cell { text-align: center; font-weight: 700; font-size: 1.2rem; }
    .medal-cell.gold { color: #FFD700; }
    .medal-cell.silver { color: #C0C0C0; }
    .medal-cell.bronze { color: #CD7F32; }
    
    .total-score { color: #ff6b35; font-weight: 900; font-size: 1.1rem; }
    .total-medals { color: #fff; font-weight: 700; }
    
    .sport-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 107, 53, 0.2);
        transition: all 0.3s ease;
    }
    
    .sport-card:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: translateY(-2px);
    }
    
    .sport-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        color: #ff6b35;
    }
    
    .sport-header i {
        font-size: 1.5rem;
    }
    
    .medal-winners {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .medal-winners > div {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .sports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    
    .no-results {
        text-align: center;
        color: #aaa;
        padding: 1rem;
    }
    
    .medal-table th {
        background: rgba(255, 107, 53, 0.2);
        color: #fff;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.9rem;
        letter-spacing: 1px;
        padding: 1rem;
        border-bottom: 2px solid rgba(255, 107, 53, 0.4);
    }
    
    .medal-table td {
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 107, 53, 0.2);
    }
`;
document.head.appendChild(style);
