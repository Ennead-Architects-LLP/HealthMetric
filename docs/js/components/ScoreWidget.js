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
            
            <div class="widget-value-container">
                <div class="widget-count" style="color: ${colors.text}; font-weight: 700; font-size: 2.2em;">${this.formatValue(this.metric.actual)}</div>
                <div class="widget-score" style="color: ${colors.border}; font-weight: 600; font-size: 1.1em; margin-top: 4px;">
                    ${this.metric.contribution.toFixed(1)}/${this.metric.weight}
                </div>
            </div>
            
            <div class="widget-gauge">
                <svg class="gauge-svg" viewBox="0 0 140 70">
                    <defs>
                        <linearGradient id="gauge-${this.metric.metric.replace(/\s+/g, '-')}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:${colors.gaugeStart};stop-opacity:1" />
                            <stop offset="100%" style="stop-color:${colors.gaugeEnd};stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Gauge track (background) -->
                    <path d="M 10 60 A 60 60 0 0 1 130 60" 
                          stroke="#e0e0e0" 
                          stroke-width="10" 
                          fill="none" />
                    
                    <!-- Gauge fill (stroke arc) with smooth animation -->
                    <path d="${this.getGaugeArcPath()}" 
                          stroke="url(#gauge-${this.metric.metric.replace(/\s+/g, '-')})" 
                          stroke-width="10"
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
                        <span class="gauge-label-title">Base Min</span>
                        <span class="gauge-min">${this.formatValue(this.metric.min)}</span>
                    </div>
                    <div class="gauge-label-group">
                        <span class="gauge-label-title">Base Max</span>
                        <span class="gauge-max">${this.formatValue(this.metric.max)}</span>
                    </div>
                </div>
                ${this.hasScaledValues() ? `
                <div class="gauge-labels gauge-labels-scaled">
                    <div class="gauge-label-group">
                        <span class="gauge-label-title">Scaled Min</span>
                        <span class="gauge-scaled-min">${this.formatValue(this.metric.scaled_min)}</span>
                    </div>
                    <div class="gauge-label-group">
                        <span class="gauge-label-title">Scaled Max</span>
                        <span class="gauge-scaled-max">${this.formatValue(this.metric.scaled_max)}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Add click handler for info icon with flip animation
        const infoIcon = this.widget.querySelector('.info-icon');
        infoIcon.addEventListener('click', () => this.flipAndShowInfo(infoIcon));
        
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
        const radius = 60; // Larger radius for bigger gauge
        const centerX = 70;
        const centerY = 60;
        
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
        
        // Calculate the arc path more precisely
        // Start from left (180 degrees) and sweep to the right
        const startAngle = Math.PI; // 180 degrees (left side)
        const sweepAngle = Math.PI * actualPercentage; // Total sweep angle
        const endAngle = startAngle + sweepAngle; // End angle
        
        // Calculate start and end points
        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);
        
        // Create arc path with proper flags
        const largeArcFlag = sweepAngle > Math.PI ? 1 : 0;
        const sweepFlag = 1; // Clockwise
        
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
        const startAngle = Math.PI; // 180 degrees (left side)
        const sweepAngle = Math.PI * actualPercentage; // Total sweep angle
        const markerAngle = startAngle + sweepAngle; // Marker angle
        const radius = 57; // Slightly smaller than arc radius to avoid overlap
        const centerX = 70;
        
        return centerX + radius * Math.cos(markerAngle);
    }
    
    getMarkerY() {
        const actualPercentage = this.getActualPercentage();
        const startAngle = Math.PI; // 180 degrees (left side)
        const sweepAngle = Math.PI * actualPercentage; // Total sweep angle
        const markerAngle = startAngle + sweepAngle; // Marker angle
        const radius = 57; // Slightly smaller than arc radius to avoid overlap
        const centerY = 60;
        
        return centerY + radius * Math.sin(markerAngle);
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
        // Create custom modal instead of using alert()
        this.createInfoModal();
    }
    
    flipAndShowInfo(infoIcon) {
        // Prevent multiple clicks during animation
        if (infoIcon.classList.contains('flipping') || infoIcon.classList.contains('flipped')) {
            return;
        }
        
        // Add flipping class and start animation
        infoIcon.classList.add('flipping');
        
        // After flip animation completes, show modal and mark as flipped
        setTimeout(() => {
            infoIcon.classList.remove('flipping');
            infoIcon.classList.add('flipped');
            
            // Show the modal after a brief delay
            setTimeout(() => {
                this.showInfo();
            }, 200);
            
        }, 600); // Match the animation duration
    }
    
    createInfoModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('score-info-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal content
        let infoContent = `
            <div class="modal-header">
                <h3 class="modal-title">${this.metric.metric}</h3>
                <button class="modal-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="metric-info">
                    <div class="info-row">
                        <span class="info-label">Current Value:</span>
                        <span class="info-value">${this.formatValue(this.metric.actual)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Score:</span>
                        <span class="info-value">${this.metric.contribution.toFixed(1)}/${this.metric.weight}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Grade:</span>
                        <span class="info-value grade-${this.metric.grade.toLowerCase()}">${this.metric.grade}</span>
                    </div>
                </div>
                
                <div class="limits-section">
                    <h4>Base Limits (500 MB model)</h4>
                    <div class="info-row">
                        <span class="info-label">Minimum:</span>
                        <span class="info-value">${this.formatValue(this.metric.min)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Maximum:</span>
                        <span class="info-value">${this.formatValue(this.metric.max)}</span>
                    </div>
                </div>
        `;
        
        if (this.hasScaledValues()) {
            infoContent += `
                <div class="limits-section">
                    <h4>Scaled Limits (for this model)</h4>
                    <div class="info-row">
                        <span class="info-label">Minimum:</span>
                        <span class="info-value">${this.formatValue(this.metric.scaled_min)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Maximum:</span>
                        <span class="info-value">${this.formatValue(this.metric.scaled_max)}</span>
                    </div>
                </div>
            `;
        }
        
        infoContent += `
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-primary" id="modal-ok-btn">OK</button>
            </div>
        `;
        
        // Create modal element
        const modal = document.createElement('div');
        modal.id = 'score-info-modal';
        modal.className = 'score-info-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-container">
                ${infoContent}
            </div>
        `;
        
        // Add modal to document
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const okBtn = modal.querySelector('#modal-ok-btn');
        const backdrop = modal.querySelector('.modal-backdrop');
        
        const closeModal = () => {
            modal.classList.add('modal-closing');
            setTimeout(() => {
                modal.remove();
                // Reset the info icon after modal closes
                const infoIcon = document.querySelector('.info-icon.flipped');
                if (infoIcon) {
                    infoIcon.classList.remove('flipped');
                }
            }, 200);
        };
        
        closeBtn.addEventListener('click', closeModal);
        okBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('modal-showing');
        }, 10);
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
