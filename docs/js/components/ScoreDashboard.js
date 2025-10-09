/**
 * ScoreDashboard Component
 * Manages a grid of ScoreWidget components for displaying model health metrics
 */

class ScoreDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.widgets = new Map();
        this.metrics = [];
        
        if (!this.container) {
            throw new Error(`Container with id '${containerId}' not found`);
        }
        
        this.initializeDashboard();
    }
    
    initializeDashboard() {
        // Create dashboard structure
        this.container.innerHTML = `
            <div class="dashboard-header">
                <h2>Model Health Metrics</h2>
            </div>
            
            <div class="score-widgets-grid" id="widgets-grid">
                <!-- Widgets will be inserted here -->
            </div>
            
            <div class="dashboard-summary" id="dashboard-summary">
                <!-- Summary will be inserted here -->
            </div>
        `;
    }
    
    loadScoreData(scoreData) {
        if (!scoreData || !scoreData.metrics) {
            console.error('Invalid score data provided');
            return;
        }
        
        this.metrics = scoreData.metrics;
        this.renderWidgets();
        this.updateSummary(scoreData);
    }
    
    renderWidgets() {
        const grid = document.getElementById('widgets-grid');
        if (!grid) return;
        
        // Clear existing widgets
        grid.innerHTML = '';
        this.widgets.clear();
        
        // Create widgets for each metric
        this.metrics.forEach(metric => {
            const widgetContainer = document.createElement('div');
            grid.appendChild(widgetContainer);
            
            const widget = new ScoreWidget(widgetContainer, metric);
            this.widgets.set(metric.metric, widget);
        });
    }
    
    updateSummary(scoreData) {
        const summaryContainer = document.getElementById('dashboard-summary');
        if (!summaryContainer) return;
        
        const totalScore = scoreData.total_score || 0;
        const grade = scoreData.grade || 'F';
        const gradeColor = this.getGradeColor(grade);
        
        // Count metrics by status
        const statusCounts = this.getStatusCounts();
        
        summaryContainer.innerHTML = `
            <div class="summary-card">
                <div class="summary-header">
                    <h3>Overall Health Score</h3>
                </div>
                
                <div class="summary-content">
                    <div class="overall-score">
                        <div class="score-circle" style="background: ${gradeColor}">
                            <span class="score-value">${totalScore.toFixed(1)}</span>
                            <span class="score-grade">${grade}</span>
                        </div>
                    </div>
                    
                    <div class="status-breakdown">
                        <div class="status-item excellent">
                            <span class="status-count">${statusCounts.excellent}</span>
                            <span class="status-label">Excellent</span>
                        </div>
                        <div class="status-item good">
                            <span class="status-count">${statusCounts.good}</span>
                            <span class="status-label">Good</span>
                        </div>
                        <div class="status-item warning">
                            <span class="status-count">${statusCounts.warning}</span>
                            <span class="status-label">Warning</span>
                        </div>
                        <div class="status-item critical">
                            <span class="status-count">${statusCounts.critical}</span>
                            <span class="status-label">Critical</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getStatusCounts() {
        const counts = {
            excellent: 0,
            good: 0,
            warning: 0,
            critical: 0
        };
        
        this.metrics.forEach(metric => {
            const percentage = this.calculatePercentage(metric);
            
            if (percentage >= 90) counts.excellent++;
            else if (percentage >= 80) counts.good++;
            else if (percentage >= 60) counts.warning++;
            else counts.critical++;
        });
        
        return counts;
    }
    
    calculatePercentage(metric) {
        if (metric.max === metric.min) {
            return metric.actual <= metric.min ? 100 : 0;
        }
        
        const percentage = Math.max(0, Math.min(1, 
            (metric.max - metric.actual) / (metric.max - metric.min)
        ));
        
        return percentage * 100;
    }
    
    getGradeColor(grade) {
        const colors = {
            'A': '#4caf50',
            'B': '#8bc34a',
            'C': '#ff9800',
            'D': '#ff5722',
            'F': '#f44336'
        };
        
        return colors[grade] || colors['F'];
    }
    
    updateWidget(metricName, newMetric) {
        const widget = this.widgets.get(metricName);
        if (widget) {
            widget.updateMetric(newMetric);
        }
    }
    
    destroy() {
        // Clean up widgets
        this.widgets.forEach(widget => widget.destroy());
        this.widgets.clear();
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoreDashboard;
}
