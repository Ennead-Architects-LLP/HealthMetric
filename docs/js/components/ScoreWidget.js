/**
 * ScoreWidget Component
 * Displays individual metric scores with gauges, colors, and status indicators
 */

class ScoreWidget {
    constructor(container, metric) {
        this.container = container;
        this.metric = metric;
        this.widget = null;
        
        this.createWidget();
    }
    
    createWidget() {
        // Create widget container
        this.widget = document.createElement('div');
        this.widget.className = 'score-widget';
        
        // Determine status and colors
        const status = this.getStatus();
        const colors = this.getColors(status);
        
        // Set background color
        this.widget.style.backgroundColor = colors.background;
        
        // Create widget content
        this.widget.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${this.metric.metric}</h3>
                <div class="info-icon" title="Click for more information">i</div>
            </div>
            
            <div class="widget-value">${this.formatValue(this.metric.actual)}</div>
            
            <div class="widget-gauge">
                <svg class="gauge-svg" viewBox="0 0 120 60">
                    <defs>
                        <linearGradient id="gauge-${this.metric.metric.replace(/\s+/g, '-')}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:${colors.gaugeStart};stop-opacity:1" />
                            <stop offset="100%" style="stop-color:${colors.gaugeEnd};stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Gauge track (background) -->
                    <path d="M 10 50 A 50 50 0 0 1 110 50" 
                          stroke="#e0e0e0" 
                          stroke-width="8" 
                          fill="none" />
                    
                    <!-- Gauge fill (solid arc) -->
                    <path d="${this.getGaugeArcPath()}" 
                          fill="url(#gauge-${this.metric.metric.replace(/\s+/g, '-')})" 
                          class="gauge-fill" />
                    
                    <!-- Gauge marker (thin vertical line) -->
                    <line x1="${this.getMarkerPosition()}" y1="${this.getMarkerY() - 3}" 
                          x2="${this.getMarkerPosition()}" y2="${this.getMarkerY() + 3}" 
                          stroke="#000" 
                          stroke-width="2" 
                          class="gauge-marker" />
                </svg>
                
                <div class="gauge-labels">
                    <span class="gauge-min">${this.metric.min}</span>
                    <span class="gauge-max">${this.metric.max}</span>
                </div>
            </div>
        `;
        
        // Add click handler for info icon
        const infoIcon = this.widget.querySelector('.info-icon');
        infoIcon.addEventListener('click', () => this.showInfo());
        
        // Append to container
        this.container.appendChild(this.widget);
    }
    
    getStatus() {
        const percentage = this.getPercentage();
        
        // getPercentage() already returns the correct health percentage (lower values = higher percentage)
        if (percentage >= 90) return 'excellent';
        if (percentage >= 80) return 'good';
        if (percentage >= 70) return 'warning';
        if (percentage >= 60) return 'poor';
        return 'critical';
    }
    
    getColors(status) {
        const colorMap = {
            excellent: {
                background: '#e8f5e8',
                gaugeStart: '#4caf50',
                gaugeEnd: '#66bb6a'
            },
            good: {
                background: '#e3f2fd',
                gaugeStart: '#2196f3',
                gaugeEnd: '#42a5f5'
            },
            warning: {
                background: '#fff3e0',
                gaugeStart: '#ff9800',
                gaugeEnd: '#ffb74d'
            },
            poor: {
                background: '#ffebee',
                gaugeStart: '#f44336',
                gaugeEnd: '#ef5350'
            },
            critical: {
                background: '#fce4ec',
                gaugeStart: '#e91e63',
                gaugeEnd: '#f06292'
            }
        };
        
        return colorMap[status] || colorMap.warning;
    }
    
    getPercentage() {
        if (this.metric.max === this.metric.min) {
            return this.metric.actual <= this.metric.min ? 100 : 0;
        }
        
        // For metrics where lower is better, reverse the calculation
        const percentage = Math.max(0, Math.min(1, 
            (this.metric.max - this.metric.actual) / (this.metric.max - this.metric.min)
        ));
        
        return percentage * 100;
    }
    
    getGaugeArcPath() {
        const percentage = this.getPercentage() / 100;
        const radius = 50;
        const centerX = 60;
        const centerY = 50;
        
        // Calculate the end angle based on percentage
        const startAngle = Math.PI; // 180 degrees (left side)
        const endAngle = Math.PI - (Math.PI * percentage); // Sweep from left to right
        
        // Calculate start and end points
        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);
        
        // Create arc path
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        const sweepFlag = 1; // Clockwise
        
        return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY} L ${centerX} ${centerY} Z`;
    }
    
    getMarkerPosition() {
        const percentage = this.getPercentage() / 100;
        const angle = Math.PI * percentage; // 0 to π radians
        const radius = 50;
        const centerX = 60;
        
        return centerX + radius * Math.cos(Math.PI - angle);
    }
    
    getMarkerY() {
        const percentage = this.getPercentage() / 100;
        const angle = Math.PI * percentage;
        const radius = 50;
        const centerY = 50;
        
        return centerY + radius * Math.sin(Math.PI - angle);
    }
    
    formatValue(value) {
        // Format large numbers with commas
        if (value >= 1000) {
            return value.toLocaleString();
        }
        
        // Format decimal numbers
        if (value % 1 !== 0) {
            return value.toFixed(1);
        }
        
        return value.toString();
    }
    
    showInfo() {
        // Create info modal or tooltip
        const info = `
            <strong>${this.metric.metric}</strong><br>
            Current Value: ${this.formatValue(this.metric.actual)}<br>
            Target Range: ${this.metric.min} - ${this.metric.max}<br>
            Score: ${this.metric.contribution}/${this.metric.weight}<br>
            Grade: ${this.metric.grade}
        `;
        
        // Simple alert for now - can be replaced with a proper modal
        alert(info);
    }
    
    updateMetric(newMetric) {
        this.metric = newMetric;
        
        // Remove old widget
        if (this.widget) {
            this.widget.remove();
        }
        
        // Create new widget
        this.createWidget();
    }
    
    destroy() {
        if (this.widget) {
            this.widget.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoreWidget;
}
