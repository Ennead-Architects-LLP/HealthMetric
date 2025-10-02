/**
 * HealthMetric Dashboard - Main Application
 * Core application logic and initialization
 */

class HealthMetricApp {
    constructor() {
        this.currentPage = 'hero';
        this.dataParser = null;
        this.heroAnimations = null;
        this.dashboard = null;
        
        this.init();
    }
    
    init() {
        // Initialize based on current page
        this.detectPage();
        this.initializePage();
        this.bindGlobalEvents();
    }
    
    detectPage() {
        const path = window.location.pathname;
        if (path.includes('dashboard.html')) {
            this.currentPage = 'dashboard';
        } else {
            this.currentPage = 'hero';
        }
    }
    
    initializePage() {
        switch (this.currentPage) {
            case 'hero':
                this.initializeHeroPage();
                break;
            case 'dashboard':
                this.initializeDashboardPage();
                break;
        }
    }
    
    initializeHeroPage() {
        // Initialize hero animations
        this.heroAnimations = new HeroAnimations();
        
        // Initialize slideshow
        this.initializeSlideshow();
        
        // Load and display metrics
        this.loadHeroMetrics();
        
        // Handle dashboard button
        this.bindHeroEvents();
    }
    
    initializeDashboardPage() {
        // Initialize dashboard components
        this.initializeDashboard();
        
        // Load dashboard data
        this.loadDashboardData();
    }
    
    initializeSlideshow() {
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        
        if (slides.length === 0) return;
        
        const slideInterval = setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000);
        
        // Store interval for cleanup
        this.slideInterval = slideInterval;
    }
    
    async loadHeroMetrics() {
        try {
            // Try to load actual data first
            const data = await this.loadDataFiles();
            
            if (data && data.summary) {
                // Use real data
                this.displayMetrics(data.summary);
            } else {
                // Fallback to mock data
                this.displayMockMetrics();
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
            this.displayErrorMetrics();
        }
    }
    
    async loadDataFiles() {
        try {
            // This would load actual JSON files from the asset/data directory
            // For now, we'll return null to use mock data
            return null;
        } catch (error) {
            console.error('Error loading data files:', error);
            return null;
        }
    }
    
    displayMetrics(summary) {
        this.animateNumber('totalProjects', summary.uniqueProjects || 0);
        this.animateNumber('totalElements', summary.totalElements || 0);
        this.animateNumber('totalViews', summary.totalViews || 0);
        this.animateNumber('totalWarnings', summary.totalWarnings || 0);
    }
    
    displayMockMetrics() {
        const mockData = {
            totalProjects: 7,
            totalElements: 16275,
            totalViews: 277,
            totalWarnings: 0
        };
        
        this.animateNumber('totalProjects', mockData.totalProjects);
        this.animateNumber('totalElements', mockData.totalElements);
        this.animateNumber('totalViews', mockData.totalViews);
        this.animateNumber('totalWarnings', mockData.totalWarnings);
    }
    
    displayErrorMetrics() {
        document.getElementById('totalProjects').textContent = 'Error';
        document.getElementById('totalElements').textContent = 'Error';
        document.getElementById('totalViews').textContent = 'Error';
        document.getElementById('totalWarnings').textContent = 'Error';
    }
    
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const duration = 2000;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(easeOutQuart * targetValue);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        };
        
        requestAnimationFrame(updateNumber);
    }
    
    bindHeroEvents() {
        const enterBtn = document.getElementById('enterDashboardBtn');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                this.navigateToDashboard();
            });
        }
    }
    
    navigateToDashboard() {
        // Show loading state
        const loading = document.getElementById('heroLoading');
        if (loading) {
            loading.classList.remove('hidden');
        }
        
        // Add screen wipe transition
        document.body.classList.add('screen-wipe');
        
        // Navigate to dashboard after animation
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
    
    initializeDashboard() {
        // Initialize dashboard components
        console.log('Initializing dashboard...');
        // Dashboard initialization will be handled by Dashboard.js
    }
    
    async loadDashboardData() {
        try {
            // Load and parse data files
            this.dataParser = new DataParser();
            // Dashboard data loading will be handled by Dashboard.js
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    bindGlobalEvents() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC key to go back to hero page
            if (e.key === 'Escape' && this.currentPage === 'dashboard') {
                window.location.href = 'index.html';
            }
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.detectPage();
            this.initializePage();
        });
        
        // Handle visibility change (pause animations when tab is not active)
        document.addEventListener('visibilitychange', () => {
            if (this.heroAnimations) {
                if (document.hidden) {
                    this.heroAnimations.pause();
                } else {
                    this.heroAnimations.resume();
                }
            }
        });
    }
    
    // Public methods for external use
    getCurrentPage() {
        return this.currentPage;
    }
    
    getDataParser() {
        return this.dataParser;
    }
    
    getHeroAnimations() {
        return this.heroAnimations;
    }
    
    // Cleanup method
    destroy() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        
        if (this.heroAnimations) {
            this.heroAnimations.destroy();
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.healthMetricApp = new HealthMetricApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.healthMetricApp) {
        window.healthMetricApp.destroy();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthMetricApp;
}
