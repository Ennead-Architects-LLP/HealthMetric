/**
 * HealthMetric Dashboard - Toast Notification Component
 * Manages popup and fading notifications for scope changes and other events
 */

class ToastNotification {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = new Map();
        this.maxToasts = 3;
        this.defaultDuration = 4000; // 4 seconds
    }

    /**
     * Show a scope change notification
     * @param {Object} scopeInfo - Information about the current scope
     */
    showScopeNotification(scopeInfo) {
        const { type, hubName, projectName, modelName } = scopeInfo;
        
        let title = 'Viewing Scope Changed';
        let message = '';
        let details = [];
        let icon = 'asset/icon/analyze.png';
        let badgeClass = 'scope-all';
        let badgeText = 'ALL DATA';

        if (type === 'all') {
            message = 'Showing all models across all projects and hubs';
            badgeClass = 'scope-all';
            badgeText = 'ALL DATA';
            icon = 'asset/icon/data.png';
        } else if (type === 'hub') {
            message = `Viewing all projects in hub`;
            badgeClass = 'scope-hub';
            badgeText = 'HUB';
            icon = 'asset/icon/building.png';
            details.push({ label: 'Hub', value: hubName });
        } else if (type === 'project') {
            message = `Viewing all models in project`;
            badgeClass = 'scope-project';
            badgeText = 'PROJECT';
            icon = 'asset/icon/data.png';
            details.push({ label: 'Hub', value: hubName });
            details.push({ label: 'Project', value: projectName });
        } else if (type === 'model') {
            message = `Viewing single model`;
            badgeClass = 'scope-model';
            badgeText = 'MODEL';
            icon = 'asset/icon/usage.png';
            details.push({ label: 'Hub', value: hubName });
            details.push({ label: 'Project', value: projectName });
            details.push({ label: 'Model', value: modelName });
        }

        const content = this.createScopeContent(title, message, badgeText, badgeClass, details);
        this.show(content, 'scope', icon, this.defaultDuration);
    }

    /**
     * Create HTML content for scope notification
     */
    createScopeContent(title, message, badgeText, badgeClass, details) {
        let detailsHtml = '';
        if (details && details.length > 0) {
            const detailItems = details.map(d => 
                `<div class="scope-detail-item">
                    <span class="scope-detail-label">${d.label}:</span>
                    <span class="scope-detail-value">${d.value}</span>
                </div>`
            ).join('');
            
            detailsHtml = `<div class="scope-details">${detailItems}</div>`;
        }

        return `
            <div class="toast-title">
                ${title}
                <span class="scope-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="toast-message">${message}</div>
            ${detailsHtml}
        `;
    }

    /**
     * Show a generic toast notification
     * @param {string} content - HTML content for the toast
     * @param {string} type - Type of toast (scope, success, warning, error)
     * @param {string} icon - Path to icon image
     * @param {number} duration - Duration in milliseconds (0 = no auto-hide)
     */
    show(content, type = 'scope', icon = 'asset/icon/analyze.png', duration = null) {
        // Remove oldest toast if at max capacity
        if (this.toasts.size >= this.maxToasts) {
            const oldestId = this.toasts.keys().next().value;
            this.hide(oldestId);
        }

        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toast = this.createToast(id, content, type, icon);
        
        this.container.appendChild(toast);
        this.toasts.set(id, toast);

        // Trigger show animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto-hide after duration
        const hideDuration = duration !== null ? duration : this.defaultDuration;
        if (hideDuration > 0) {
            const timeout = setTimeout(() => {
                this.hide(id);
            }, hideDuration);

            // Store timeout so we can cancel it if manually closed
            toast.dataset.timeout = timeout;
        }

        return id;
    }

    /**
     * Create toast DOM element
     */
    createToast(id, content, type, icon) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.id = id;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        toast.innerHTML = `
            <div class="toast-icon">
                <img src="${icon}" alt="${type} icon">
            </div>
            <div class="toast-content">
                ${content}
            </div>
            <button class="toast-close" aria-label="Close notification">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="toast-progress">
                <div class="toast-progress-bar"></div>
            </div>
        `;

        // Add close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hide(id);
        });

        return toast;
    }

    /**
     * Hide a toast notification
     * @param {string} id - Toast ID
     */
    hide(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;

        // Clear timeout if exists
        if (toast.dataset.timeout) {
            clearTimeout(parseInt(toast.dataset.timeout));
        }

        // Trigger hide animation
        toast.classList.remove('show');
        toast.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            this.toasts.delete(id);
        }, 300);
    }

    /**
     * Hide all toasts
     */
    hideAll() {
        const ids = Array.from(this.toasts.keys());
        ids.forEach(id => this.hide(id));
    }

    /**
     * Show a success notification
     */
    success(title, message, duration = 3000) {
        const content = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;
        return this.show(content, 'success', 'asset/icon/performance.png', duration);
    }

    /**
     * Show a warning notification
     */
    warning(title, message, duration = 4000) {
        const content = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;
        return this.show(content, 'warning', 'asset/icon/warning.png', duration);
    }

    /**
     * Show an error notification
     */
    error(title, message, duration = 5000) {
        const content = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;
        return this.show(content, 'error', 'asset/icon/warning.png', duration);
    }
}

// Make available globally
window.ToastNotification = ToastNotification;

