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
        
        // Set enhanced background with gradient and shadow
        this.widget.style.background = colors.background;
        this.widget.style.border = `2px solid ${colors.border}`;
        this.widget.style.boxShadow = `0 4px 12px ${colors.shadow}`;
        this.widget.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Create widget content
        this.widget.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title" style="color: ${colors.text}; font-weight: 600;">${this.metric.metric}</h3>
                <div class="info-icon" title="Click for more information" style="color: ${colors.border}; background: ${colors.shadow};">i</div>
            </div>
            
            <div class="widget-value" style="color: ${colors.text}; font-weight: 700; font-size: 2.2em;">${this.formatValue(this.metric.actual)}</div>
            
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
                    
                    <!-- Gauge fill (stroke arc) with smooth animation -->
                    <path d="${this.getGaugeArcPath()}" 
                          stroke="url(#gauge-${this.metric.metric.replace(/\s+/g, '-')})" 
                          stroke-width="8"
                          fill="none"
                          class="gauge-fill"
                          style="transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);" />
                    
                    <!-- Gauge marker (thin vertical line) with smooth movement -->
                    <line x1="${this.getMarkerPosition()}" y1="${this.getMarkerY() - 3}" 
                          x2="${this.getMarkerPosition()}" y2="${this.getMarkerY() + 3}" 
                          stroke="${colors.border}" 
                          stroke-width="3" 
                          class="gauge-marker"
                          style="transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);" />
                </svg>
                
                <div class="gauge-labels">
                    <div class="gauge-label-group">
                        <span class="gauge-label-title">Min</span>
                        <span class="gauge-min">${this.formatValue(this.metric.min)}</span>
                        ${this.hasScaledValues() ? `<span class="gauge-scaled">(${this.formatValue(this.metric.scaled_min)})</span>` : ''}
                    </div>
                    <div class="gauge-label-group">
                        <span class="gauge-label-title">Max</span>
                        <span class="gauge-max">${this.formatValue(this.metric.max)}</span>
                        ${this.hasScaledValues() ? `<span class="gauge-scaled">(${this.formatValue(this.metric.scaled_max)})</span>` : ''}
                    </div>
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
        const actualPercentage = this.getActualPercentage();
        
        // For metrics where lower is better, reverse the percentage for status calculation
        const healthPercentage = 1 - actualPercentage;
        
        if (healthPercentage >= 0.9) return 'excellent';
        if (healthPercentage >= 0.8) return 'good';
        if (healthPercentage >= 0.7) return 'warning';
        if (healthPercentage >= 0.6) return 'poor';
        return 'critical';
    }
    
    getColors(status) {
        // Enhanced color scheme based on research - more intuitive and accessible
        const colorMap = {
            excellent: {
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
                gaugeStart: '#2e7d32',
                gaugeEnd: '#4caf50',
                border: '#4caf50',
                text: '#1b5e20',
                shadow: 'rgba(76, 175, 80, 0.2)'
            },
            good: {
                background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)',
                gaugeStart: '#1976d2',
                gaugeEnd: '#2196f3',
                border: '#2196f3',
                text: '#0d47a1',
                shadow: 'rgba(33, 150, 243, 0.2)'
            },
            warning: {
                background: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)',
                gaugeStart: '#f57c00',
                gaugeEnd: '#ff9800',
                border: '#ff9800',
                text: '#e65100',
                shadow: 'rgba(255, 152, 0, 0.2)'
            },
            poor: {
                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                gaugeStart: '#ff8f00',
                gaugeEnd: '#ff9800',
                border: '#ff9800',
                text: '#e65100',
                shadow: 'rgba(255, 152, 0, 0.2)'
            },
            critical: {
                background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                gaugeStart: '#d32f2f',
                gaugeEnd: '#f44336',
                border: '#f44336',
                text: '#b71c1c',
                shadow: 'rgba(244, 67, 54, 0.2)'
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
        // Calculate the actual percentage based on the metric value vs scaled max
        const actualPercentage = this.getActualPercentage();
        const radius = 50;
        const centerX = 60;
        const centerY = 50;
        
        // Use scaled values for display context
        const minValue = this.hasScaledValues() ? this.metric.scaled_min : this.metric.min;
        const maxValue = this.hasScaledValues() ? this.metric.scaled_max : this.metric.max;
        
        // Debug logging
        console.log(`Gauge calculation for ${this.metric.metric}:`, {
            actual: this.metric.actual,
            min: this.metric.min,
            max: this.metric.max,
            scaled_min: this.metric.scaled_min,
            scaled_max: this.metric.scaled_max,
            using_scaled: this.hasScaledValues(),
            effective_min: minValue,
            effective_max: maxValue,
            actualPercentage: actualPercentage,
            percentageDisplay: (actualPercentage * 100).toFixed(1) + '%'
        });
        
        // Calculate the end angle based on actual percentage
        // Start from left (180 degrees) and sweep clockwise
        const startAngle = Math.PI; // 180 degrees (left side)
        const endAngle = Math.PI - (Math.PI * actualPercentage); // Sweep from left to right
        
        // Calculate start and end points
        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);
        
        // Create arc path - this creates a filled pie slice
        const largeArcFlag = actualPercentage > 0.5 ? 1 : 0;
        const sweepFlag = 1; // Clockwise
        
        // The issue might be that we're creating a filled arc instead of just a stroke
        // Let's create a proper arc path that represents the percentage correctly
        return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
    }
    
    getActualPercentage() {
        // Use scaled values if available, otherwise use base values
        const minValue = this.hasScaledValues() ? this.metric.scaled_min : this.metric.min;
        const maxValue = this.hasScaledValues() ? this.metric.scaled_max : this.metric.max;
        
        if (maxValue === minValue) {
            return this.metric.actual <= minValue ? 0 : 1;
        }
        
        // Clamp the actual value between the appropriate min and max
        const clampedActual = Math.max(minValue, Math.min(maxValue, this.metric.actual));
        
        // Calculate percentage: (actual - min) / (max - min)
        const percentage = (clampedActual - minValue) / (maxValue - minValue);
        
        return Math.max(0, Math.min(1, percentage));
    }
    
    getMarkerPosition() {
        const actualPercentage = this.getActualPercentage();
        const angle = Math.PI * actualPercentage; // 0 to π radians
        const radius = 50;
        const centerX = 60;
        
        return centerX + radius * Math.cos(Math.PI - angle);
    }
    
    getMarkerY() {
        const actualPercentage = this.getActualPercentage();
        const angle = Math.PI * actualPercentage;
        const radius = 50;
        const centerY = 50;
        
        return centerY + radius * Math.sin(Math.PI - angle);
    }
    
    hasScaledValues() {
        // Check if scaled values exist and are different from base values
        return this.metric.scaled_min !== undefined && 
               this.metric.scaled_max !== undefined &&
               (this.metric.scaled_min !== this.metric.min || 
                this.metric.scaled_max !== this.metric.max);
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
        let info = `
            <strong>${this.metric.metric}</strong><br>
            <br>
            <strong>Current Value:</strong> ${this.formatValue(this.metric.actual)}<br>
            <br>
            <strong>Base Limits (500 MB model):</strong><br>
            Min: ${this.formatValue(this.metric.min)}<br>
            Max: ${this.formatValue(this.metric.max)}<br>
        `;
        
        if (this.hasScaledValues()) {
            info += `
            <br>
            <strong>Scaled Limits (for this model):</strong><br>
            Min: ${this.formatValue(this.metric.scaled_min)}<br>
            Max: ${this.formatValue(this.metric.scaled_max)}<br>
            `;
        }
        
        info += `
            <br>
            <strong>Score:</strong> ${this.metric.contribution}/${this.metric.weight}<br>
            <strong>Grade:</strong> ${this.metric.grade}
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
