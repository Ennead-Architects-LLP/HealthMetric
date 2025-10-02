/**
 * HealthMetric Dashboard - Hero Animations
 * Flying file names with mouse tracking and ghost effects
 */

class HeroAnimations {
    constructor() {
        this.flyingItems = [];
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseMoving = false;
        this.mouseTimeout = null;
        this.maxItems = 30;
        this.animationId = null;
        this.isActive = false;
        
        // Project names from the data files
        this.projectNames = [
            'Healthcare Starter Template',
            '1643_LHH - Existing',
            '1643_LHH - New',
            '1643_LHH ULURP BASE Scheme D',
            'Lines and Fills',
            'TEMP - L1 - Ambulance Drive Thru',
            'TEMP - Programming Plans'
        ];
        
        this.hubNames = [
            'Ennead Architects LLP'
        ];
        
        this.init();
    }
    
    init() {
        this.createFlyingItems();
        this.bindEvents();
        this.startAnimation();
    }
    
    createFlyingItems() {
        const container = document.querySelector('.flying-container');
        if (!container) return;
        
        // Clear existing items
        container.innerHTML = '';
        this.flyingItems = [];
        
        for (let i = 0; i < this.maxItems; i++) {
            const item = this.createFlyingItem();
            container.appendChild(item);
            this.flyingItems.push({
                element: item,
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                targetX: 0,
                targetY: 0,
                state: 'random',
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }
    
    createFlyingItem() {
        const item = document.createElement('div');
        item.className = 'flying-item';
        
        // Randomly choose between project names and hub names
        const isProject = Math.random() > 0.3;
        const names = isProject ? this.projectNames : this.hubNames;
        const name = names[Math.floor(Math.random() * names.length)];
        
        item.textContent = name;
        item.style.left = Math.random() * window.innerWidth + 'px';
        item.style.top = Math.random() * window.innerHeight + 'px';
        item.style.opacity = Math.random() * 0.5 + 0.3;
        
        return item;
    }
    
    bindEvents() {
        // Mouse movement tracking
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
            this.isMouseMoving = true;
            
            // Clear existing timeout
            if (this.mouseTimeout) {
                clearTimeout(this.mouseTimeout);
            }
            
            // Set timeout to detect when mouse stops moving
            this.mouseTimeout = setTimeout(() => {
                this.isMouseMoving = false;
            }, 100);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Visibility change (pause when tab is not active)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    startAnimation() {
        if (this.animationId) return;
        
        this.isActive = true;
        this.animate();
    }
    
    animate() {
        if (!this.isActive) return;
        
        this.flyingItems.forEach((item, index) => {
            this.updateFlyingItem(item, index);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateFlyingItem(item, index) {
        const element = item.element;
        
        if (this.isMouseMoving) {
            // Mouse is moving - attract items to mouse
            this.attractToMouse(item);
        } else {
            // Mouse is still - random floating
            this.randomFloat(item);
        }
        
        // Apply physics
        item.x += item.vx;
        item.y += item.vy;
        
        // Boundary checking with wrapping
        if (item.x < -100) item.x = window.innerWidth + 100;
        if (item.x > window.innerWidth + 100) item.x = -100;
        if (item.y < -100) item.y = window.innerHeight + 100;
        if (item.y > window.innerHeight + 100) item.y = -100;
        
        // Apply position
        element.style.left = item.x + 'px';
        element.style.top = item.y + 'px';
        element.style.opacity = item.opacity;
        
        // Update state classes
        element.className = `flying-item ${item.state}`;
    }
    
    attractToMouse(item) {
        const dx = this.mousePosition.x - item.x;
        const dy = this.mousePosition.y - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) {
            // Attract to mouse
            const force = 0.02;
            item.vx += dx * force;
            item.vy += dy * force;
            item.state = 'attracted';
            item.opacity = Math.min(1, 0.5 + (200 - distance) / 200 * 0.5);
        } else {
            // Follow mouse direction
            const force = 0.01;
            item.vx += dx * force;
            item.vy += dy * force;
            item.state = 'following';
            item.opacity = 0.7;
        }
        
        // Apply damping
        item.vx *= 0.98;
        item.vy *= 0.98;
        
        // Limit velocity
        const maxVelocity = 2;
        const velocity = Math.sqrt(item.vx * item.vx + item.vy * item.vy);
        if (velocity > maxVelocity) {
            item.vx = (item.vx / velocity) * maxVelocity;
            item.vy = (item.vy / velocity) * maxVelocity;
        }
    }
    
    randomFloat(item) {
        // Random floating motion
        item.vx += (Math.random() - 0.5) * 0.01;
        item.vy += (Math.random() - 0.5) * 0.01;
        
        // Apply damping
        item.vx *= 0.99;
        item.vy *= 0.99;
        
        // Limit velocity
        const maxVelocity = 1;
        const velocity = Math.sqrt(item.vx * item.vx + item.vy * item.vy);
        if (velocity > maxVelocity) {
            item.vx = (item.vx / velocity) * maxVelocity;
            item.vy = (item.vy / velocity) * maxVelocity;
        }
        
        item.state = 'random';
        item.opacity = 0.4 + Math.sin(Date.now() * 0.001 + index) * 0.2;
    }
    
    handleResize() {
        // Update item positions to stay within bounds
        this.flyingItems.forEach(item => {
            if (item.x > window.innerWidth) item.x = window.innerWidth - 100;
            if (item.y > window.innerHeight) item.y = window.innerHeight - 100;
        });
    }
    
    pause() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resume() {
        if (!this.isActive) {
            this.startAnimation();
        }
    }
    
    destroy() {
        this.pause();
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Clear flying items
        const container = document.querySelector('.flying-container');
        if (container) {
            container.innerHTML = '';
        }
        
        this.flyingItems = [];
    }
    
    // Public methods for external control
    setMaxItems(count) {
        this.maxItems = Math.max(1, Math.min(50, count));
        this.createFlyingItems();
    }
    
    addProjectName(name) {
        if (!this.projectNames.includes(name)) {
            this.projectNames.push(name);
        }
    }
    
    removeProjectName(name) {
        const index = this.projectNames.indexOf(name);
        if (index > -1) {
            this.projectNames.splice(index, 1);
        }
    }
    
    // Get current animation state
    getState() {
        return {
            isActive: this.isActive,
            itemCount: this.flyingItems.length,
            mousePosition: this.mousePosition,
            isMouseMoving: this.isMouseMoving
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroAnimations;
}
