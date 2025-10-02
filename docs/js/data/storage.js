/**
 * HealthMetric Dashboard - Data Storage
 * Local storage and caching utilities
 */

class DataStorage {
    constructor() {
        this.storageKey = 'healthmetric_data';
        this.cacheKey = 'healthmetric_cache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }
    
    /**
     * Save data to localStorage
     * @param {Object} data - Data to save
     * @param {string} key - Storage key
     */
    saveData(data, key = this.storageKey) {
        try {
            const dataWithTimestamp = {
                data,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
            console.log(`Data saved to localStorage with key: ${key}`);
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            throw new Error('Failed to save data to localStorage');
        }
    }
    
    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @returns {Object|null} Loaded data or null
     */
    loadData(key = this.storageKey) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) {
                return null;
            }
            
            const parsed = JSON.parse(stored);
            
            // Check if data is expired
            if (this.isDataExpired(parsed.timestamp)) {
                console.log('Data is expired, removing from localStorage');
                this.removeData(key);
                return null;
            }
            
            return parsed.data;
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            return null;
        }
    }
    
    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    removeData(key = this.storageKey) {
        try {
            localStorage.removeItem(key);
            console.log(`Data removed from localStorage with key: ${key}`);
        } catch (error) {
            console.error('Error removing data from localStorage:', error);
        }
    }
    
    /**
     * Check if data is expired
     * @param {number} timestamp - Data timestamp
     * @returns {boolean} True if expired
     */
    isDataExpired(timestamp) {
        return Date.now() - timestamp > this.cacheExpiry;
    }
    
    /**
     * Save aggregated data with caching
     * @param {Object} aggregatedData - Aggregated data
     */
    saveAggregatedData(aggregatedData) {
        this.saveData(aggregatedData, this.storageKey);
    }
    
    /**
     * Load aggregated data from cache
     * @returns {Object|null} Aggregated data or null
     */
    loadAggregatedData() {
        return this.loadData(this.storageKey);
    }
    
    /**
     * Save cache metadata
     * @param {Object} metadata - Cache metadata
     */
    saveCacheMetadata(metadata) {
        const cacheData = {
            metadata,
            timestamp: Date.now()
        };
        
        this.saveData(cacheData, this.cacheKey);
    }
    
    /**
     * Load cache metadata
     * @returns {Object|null} Cache metadata or null
     */
    loadCacheMetadata() {
        return this.loadData(this.cacheKey);
    }
    
    /**
     * Clear all stored data
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.cacheKey);
            console.log('All data cleared from localStorage');
        } catch (error) {
            console.error('Error clearing data from localStorage:', error);
        }
    }
    
    /**
     * Get storage usage information
     * @returns {Object} Storage usage info
     */
    getStorageInfo() {
        try {
            const totalSize = this.getStorageSize();
            const dataSize = this.getDataSize(this.storageKey);
            const cacheSize = this.getDataSize(this.cacheKey);
            
            return {
                totalSize,
                dataSize,
                cacheSize,
                availableSpace: this.getAvailableSpace(),
                isFull: totalSize > this.getStorageLimit()
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
    
    /**
     * Get total storage size
     * @returns {number} Size in bytes
     */
    getStorageSize() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        return totalSize;
    }
    
    /**
     * Get size of specific data
     * @param {string} key - Storage key
     * @returns {number} Size in bytes
     */
    getDataSize(key) {
        const data = localStorage.getItem(key);
        return data ? data.length : 0;
    }
    
    /**
     * Get available storage space
     * @returns {number} Available space in bytes
     */
    getAvailableSpace() {
        const limit = this.getStorageLimit();
        const used = this.getStorageSize();
        return Math.max(0, limit - used);
    }
    
    /**
     * Get storage limit (typically 5-10MB for localStorage)
     * @returns {number} Storage limit in bytes
     */
    getStorageLimit() {
        // Most browsers limit localStorage to 5-10MB
        return 5 * 1024 * 1024; // 5MB
    }
    
    /**
     * Check if storage is available
     * @returns {boolean} True if storage is available
     */
    isStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Export data as downloadable file
     * @param {Object} data - Data to export
     * @param {string} filename - Filename for download
     */
    exportData(data, filename = 'healthmetric_data.json') {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`Data exported as ${filename}`);
        } catch (error) {
            console.error('Error exporting data:', error);
            throw new Error('Failed to export data');
        }
    }
    
    /**
     * Import data from file
     * @param {File} file - File to import
     * @returns {Promise<Object>} Imported data
     */
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.saveData(data);
                    console.log('Data imported successfully');
                    resolve(data);
                } catch (error) {
                    console.error('Error parsing imported data:', error);
                    reject(new Error('Invalid JSON file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Backup current data
     * @returns {string} Backup data as JSON string
     */
    createBackup() {
        try {
            const data = this.loadData();
            const backup = {
                data,
                timestamp: Date.now(),
                version: '1.0',
                type: 'backup'
            };
            
            return JSON.stringify(backup, null, 2);
        } catch (error) {
            console.error('Error creating backup:', error);
            return null;
        }
    }
    
    /**
     * Restore data from backup
     * @param {string} backupData - Backup data as JSON string
     * @returns {boolean} True if successful
     */
    restoreBackup(backupData) {
        try {
            const backup = JSON.parse(backupData);
            
            if (backup.type !== 'backup') {
                throw new Error('Invalid backup file');
            }
            
            this.saveData(backup.data);
            console.log('Data restored from backup');
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }
    
    /**
     * Get data statistics
     * @returns {Object} Data statistics
     */
    getDataStatistics() {
        const data = this.loadData();
        
        if (!data) {
            return {
                totalFiles: 0,
                totalElements: 0,
                totalViews: 0,
                totalWarnings: 0,
                dateRange: null,
                lastUpdated: null
            };
        }
        
        return {
            totalFiles: data.summary?.totalFiles || 0,
            totalElements: data.summary?.totalElements || 0,
            totalViews: data.summary?.totalViews || 0,
            totalWarnings: data.summary?.totalWarnings || 0,
            dateRange: data.summary?.dateRange || null,
            lastUpdated: data.timestamp || null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataStorage;
}
