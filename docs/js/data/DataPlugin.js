/**
 * HealthMetric Dashboard - Data Plugin System
 * Plugin architecture for handling different data formats
 */

class DataPlugin {
    constructor(name, config) {
        this.name = name;
        this.config = config;
        this.enabled = true;
    }
    
    /**
     * Check if this plugin can handle the given data
     * @param {Object} data - Data to check
     * @returns {boolean} True if this plugin can handle the data
     */
    canHandle(data) {
        return false; // Override in subclasses
    }
    
    /**
     * Parse data using this plugin
     * @param {Object} data - Raw data
     * @param {string} filename - Filename
     * @returns {Object} Parsed data
     */
    parse(data, filename) {
        throw new Error('parse method must be implemented');
    }
    
    /**
     * Validate parsed data
     * @param {Object} parsedData - Parsed data to validate
     * @returns {boolean} True if valid
     */
    validate(parsedData) {
        const requiredFields = this.config.requiredFields || [];
        return requiredFields.every(field => parsedData.hasOwnProperty(field));
    }
    
    /**
     * Get plugin information
     * @returns {Object} Plugin information
     */
    getInfo() {
        return {
            name: this.name,
            version: this.config.version || '1.0.0',
            description: this.config.description || '',
            supportedFormats: this.config.supportedFormats || [],
            enabled: this.enabled
        };
    }
}

/**
 * SexyDuck Data Plugin
 */
class SexyDuckPlugin extends DataPlugin {
    constructor() {
        super('SexyDuck', {
            version: '1.0.0',
            description: 'Plugin for parsing SexyDuck format files',
            supportedFormats: ['.SexyDuck'],
            requiredFields: ['hubName', 'projectName', 'modelName', 'timestamp']
        });
    }
    
    canHandle(data) {
        return data && 
               data.job_metadata && 
               data.result_data && 
               data.status;
    }
    
    parse(data, filename) {
        const metadata = data.job_metadata || {};
        const resultData = data.result_data || {};
        
        return {
            hubName: metadata.hub_name || 'Unknown',
            projectName: metadata.project_name || 'Unknown',
            modelName: metadata.model_name || 'Unknown',
            timestamp: new Date(metadata.timestamp || Date.now()),
            executionTime: metadata.execution_time_seconds || 0,
            revitVersion: metadata.revit_version || 'Unknown',
            jobId: metadata.job_id || 'Unknown',
            totalElements: resultData.total_elements || 0,
            totalViews: resultData.total_views || 0,
            totalSheets: resultData.total_sheets || 0,
            totalFamilies: resultData.total_families || 0,
            totalRooms: resultData.total_rooms || 0,
            warningCount: resultData.warning_count || 0,
            criticalWarningCount: resultData.critical_warning_count || 0,
            viewsNotOnSheets: resultData.views_not_on_sheets || 0,
            copiedViews: resultData.copied_views || 0,
            unusedViewTemplates: resultData.unused_view_templates || 0,
            dimensions: resultData.dimensions || 0,
            dimensionOverrides: resultData.dimension_overrides || 0,
            textNotesInstances: resultData.text_notes_instances || 0,
            detailLines: resultData.detail_lines || 0,
            materials: resultData.materials || 0,
            isWorkshared: resultData.is_workshared || false,
            projectPhases: resultData.project_phases || [],
            linkedFilesCount: resultData.linked_files_count || 0,
            viewTypes: resultData.view_types || {},
            isEnneadTabAvailable: resultData.is_EnneadTab_Available || false,
            status: data.status || 'unknown',
            filename,
            parsedAt: new Date(),
            format: 'SexyDuck'
        };
    }
}

/**
 * Standard JSON Data Plugin
 */
class StandardJSONPlugin extends DataPlugin {
    constructor() {
        super('StandardJSON', {
            version: '1.0.0',
            description: 'Plugin for parsing standard JSON format files',
            supportedFormats: ['.json'],
            requiredFields: ['hubName', 'projectName', 'modelName', 'timestamp']
        });
    }
    
    canHandle(data) {
        return data && 
               (data.hubName || data.projectName || data.modelName) &&
               (data.totalElements || data.totalViews || data.warningCount);
    }
    
    parse(data, filename) {
        return {
            hubName: data.hubName || 'Unknown',
            projectName: data.projectName || 'Unknown',
            modelName: data.modelName || 'Unknown',
            timestamp: new Date(data.timestamp || Date.now()),
            executionTime: data.executionTime || 0,
            totalElements: data.totalElements || 0,
            totalViews: data.totalViews || 0,
            totalSheets: data.totalSheets || 0,
            totalFamilies: data.totalFamilies || 0,
            totalRooms: data.totalRooms || 0,
            warningCount: data.warningCount || 0,
            criticalWarningCount: data.criticalWarningCount || 0,
            viewsNotOnSheets: data.viewsNotOnSheets || 0,
            copiedViews: data.copiedViews || 0,
            unusedViewTemplates: data.unusedViewTemplates || 0,
            dimensions: data.dimensions || 0,
            dimensionOverrides: data.dimensionOverrides || 0,
            textNotesInstances: data.textNotesInstances || 0,
            detailLines: data.detailLines || 0,
            materials: data.materials || 0,
            isWorkshared: data.isWorkshared || false,
            projectPhases: data.projectPhases || [],
            linkedFilesCount: data.linkedFilesCount || 0,
            viewTypes: data.viewTypes || {},
            isEnneadTabAvailable: data.isEnneadTabAvailable || false,
            status: data.status || 'unknown',
            filename,
            parsedAt: new Date(),
            format: 'StandardJSON'
        };
    }
}

/**
 * Array Data Plugin
 */
class ArrayDataPlugin extends DataPlugin {
    constructor() {
        super('ArrayData', {
            version: '1.0.0',
            description: 'Plugin for parsing array format data',
            supportedFormats: ['.json'],
            requiredFields: ['hubName', 'projectName', 'modelName', 'timestamp']
        });
    }
    
    canHandle(data) {
        return Array.isArray(data) && data.length > 0;
    }
    
    parse(data, filename) {
        return data.map((item, index) => ({
            hubName: item.hubName || 'Unknown',
            projectName: item.projectName || 'Unknown',
            modelName: item.modelName || `Item ${index + 1}`,
            timestamp: new Date(item.timestamp || Date.now()),
            executionTime: item.executionTime || 0,
            totalElements: item.totalElements || 0,
            totalViews: item.totalViews || 0,
            totalSheets: item.totalSheets || 0,
            totalFamilies: item.totalFamilies || 0,
            totalRooms: item.totalRooms || 0,
            warningCount: item.warningCount || 0,
            criticalWarningCount: item.criticalWarningCount || 0,
            viewsNotOnSheets: item.viewsNotOnSheets || 0,
            copiedViews: item.copiedViews || 0,
            unusedViewTemplates: item.unusedViewTemplates || 0,
            dimensions: item.dimensions || 0,
            dimensionOverrides: item.dimensionOverrides || 0,
            textNotesInstances: item.textNotesInstances || 0,
            detailLines: item.detailLines || 0,
            materials: item.materials || 0,
            isWorkshared: item.isWorkshared || false,
            projectPhases: item.projectPhases || [],
            linkedFilesCount: item.linkedFilesCount || 0,
            viewTypes: item.viewTypes || {},
            isEnneadTabAvailable: item.isEnneadTabAvailable || false,
            status: item.status || 'unknown',
            filename: `${filename}[${index}]`,
            parsedAt: new Date(),
            format: 'ArrayData'
        }));
    }
}

/**
 * Plugin Manager
 */
class PluginManager {
    constructor() {
        this.plugins = [];
        this.registerDefaultPlugins();
    }
    
    /**
     * Register default plugins
     */
    registerDefaultPlugins() {
        this.register(new SexyDuckPlugin());
        this.register(new StandardJSONPlugin());
        this.register(new ArrayDataPlugin());
    }
    
    /**
     * Register a plugin
     * @param {DataPlugin} plugin - Plugin to register
     */
    register(plugin) {
        if (plugin instanceof DataPlugin) {
            this.plugins.push(plugin);
            console.log(`✅ Registered plugin: ${plugin.name}`);
        } else {
            throw new Error('Plugin must extend DataPlugin class');
        }
    }
    
    /**
     * Unregister a plugin
     * @param {string} name - Plugin name to unregister
     */
    unregister(name) {
        this.plugins = this.plugins.filter(plugin => plugin.name !== name);
        console.log(`❌ Unregistered plugin: ${name}`);
    }
    
    /**
     * Get plugin by name
     * @param {string} name - Plugin name
     * @returns {DataPlugin|null} Plugin or null
     */
    getPlugin(name) {
        return this.plugins.find(plugin => plugin.name === name) || null;
    }
    
    /**
     * Get all registered plugins
     * @returns {Array} Array of plugins
     */
    getAllPlugins() {
        return [...this.plugins];
    }
    
    /**
     * Get enabled plugins
     * @returns {Array} Array of enabled plugins
     */
    getEnabledPlugins() {
        return this.plugins.filter(plugin => plugin.enabled);
    }
    
    /**
     * Find plugin that can handle the data
     * @param {Object} data - Data to check
     * @returns {DataPlugin|null} Plugin that can handle the data
     */
    findPluginForData(data) {
        for (const plugin of this.getEnabledPlugins()) {
            if (plugin.canHandle(data)) {
                return plugin;
            }
        }
        return null;
    }
    
    /**
     * Parse data using appropriate plugin
     * @param {Object} data - Raw data
     * @param {string} filename - Filename
     * @returns {Object|null} Parsed data or null
     */
    parseData(data, filename) {
        const plugin = this.findPluginForData(data);
        if (plugin) {
            try {
                const parsed = plugin.parse(data, filename);
                if (plugin.validate(parsed)) {
                    console.log(`✅ Parsed ${filename} using ${plugin.name} plugin`);
                    return parsed;
                } else {
                    console.warn(`❌ Validation failed for ${filename} using ${plugin.name} plugin`);
                    return null;
                }
            } catch (error) {
                console.error(`❌ Error parsing ${filename} with ${plugin.name} plugin:`, error);
                return null;
            }
        } else {
            console.warn(`❌ No plugin found to handle ${filename}`);
            return null;
        }
    }
    
    /**
     * Get plugin statistics
     * @returns {Object} Plugin statistics
     */
    getStats() {
        return {
            total: this.plugins.length,
            enabled: this.getEnabledPlugins().length,
            disabled: this.plugins.length - this.getEnabledPlugins().length,
            plugins: this.plugins.map(plugin => plugin.getInfo())
        };
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DataPlugin,
        SexyDuckPlugin,
        StandardJSONPlugin,
        ArrayDataPlugin,
        PluginManager
    };
}
