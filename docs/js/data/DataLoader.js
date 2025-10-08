/**
 * HealthMetric Dashboard - Modular Data Loader
 * Automatically loads and processes any JSON data files
 */

class DataLoader {
    constructor() {
        this.dataFiles = [];
        this.parsedData = [];
        this.aggregatedData = null;
        this.dataPath = 'asset/data/';
        this.supportedFormats = ['.json', '.SexyDuck'];
        this.pluginManager = new PluginManager();
    }
    
    /**
     * Auto-discover and load all data files
     * @returns {Promise<Object>} Aggregated data
     */
    async loadAllData() {
        try {
            console.log('🔍 Discovering data files...');
            
            // Try to load from a data manifest first
            const manifest = await this.loadDataManifest();
            if (manifest) {
                return await this.loadFromManifest(manifest);
            }
            
            // Fallback: try to discover files automatically
            return await this.autoDiscoverFiles();
            
        } catch (error) {
            console.error('Error loading data:', error);
            return this.getFallbackData();
        }
    }
    
    /**
     * Load data from a manifest file
     * @param {Object} manifest - Data manifest
     * @returns {Promise<Object>} Aggregated data
     */
    async loadFromManifest(manifest) {
        console.log('📋 Loading data from manifest...');
        
        const dataPromises = manifest.files.map(file => this.loadDataFile(file));
        const fileData = await Promise.all(dataPromises);
        
        return this.processDataFiles(fileData);
    }
    
    /**
     * Auto-discover data files
     * @returns {Promise<Object>} Aggregated data
     */
    async autoDiscoverFiles() {
        console.log('🔍 Auto-discovering data files...');
        
        // Try common file patterns
        const commonFiles = [
            'data.json',
            'projects.json',
            'manifest.json',
            'healthmetric-data.json'
        ];
        
        for (const filename of commonFiles) {
            try {
                const data = await this.loadDataFile(filename);
                if (data) {
                    console.log(`✅ Found data file: ${filename}`);
                    return this.processDataFiles([data]);
                }
            } catch (error) {
                console.log(`❌ File not found: ${filename}`);
            }
        }
        
        // Try to load SexyDuck files
        return await this.loadSexyDuckFiles();
    }
    
    /**
     * Load SexyDuck files from the data directory
     * @returns {Promise<Object>} Aggregated data
     */
    async loadSexyDuckFiles() {
        console.log('🦆 Loading SexyDuck files...');
        
        try {
            // Try to get directory listing (this might not work in all browsers)
            const response = await fetch(`${this.dataPath}?list`);
            if (response.ok) {
                const files = await response.json();
                const sexyDuckFiles = files.filter(file => 
                    file.endsWith('.SexyDuck') || file.endsWith('.json')
                );
                
                if (sexyDuckFiles.length > 0) {
                    console.log(`✅ Found ${sexyDuckFiles.length} SexyDuck files`);
                    return await this.loadMultipleFiles(sexyDuckFiles);
                }
            }
        } catch (error) {
            console.log('❌ Could not list directory, trying individual files...');
        }
        
        // Try to load known SexyDuck files
        const knownFiles = [
            '2025-10_Ennead Architects LLP_1643_LHH_Healthcare Starter Template_in progress.SexyDuck',
            '2025-10_Ennead Architects LLP_1643_LHH_1643_LHH - Existing.SexyDuck',
            '2025-10_Ennead Architects LLP_1643_LHH_1643_LHH - New.SexyDuck'
        ];
        
        return await this.loadMultipleFiles(knownFiles);
    }
    
    /**
     * Load multiple files
     * @param {Array} filenames - Array of filenames
     * @returns {Promise<Object>} Aggregated data
     */
    async loadMultipleFiles(filenames) {
        const dataPromises = filenames.map(filename => 
            this.loadDataFile(filename).catch(error => {
                // Skip missing or invalid files silently
                return null;
            })
        );
        
        const fileData = await Promise.all(dataPromises);
        const validData = fileData.filter(data => data !== null);
        
        const skippedCount = filenames.length - validData.length;
        
        if (validData.length === 0) {
            console.log('❌ No valid data files found, using fallback data');
            return this.getFallbackData();
        }
        
        console.log(`✅ Successfully loaded ${validData.length} data files${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`);
        return this.processDataFiles(validData);
    }
    
    /**
     * Load a single data file
     * @param {string} filename - Filename to load
     * @returns {Promise<Object>} File data
     */
    async loadDataFile(filename) {
        const fullPath = `${this.dataPath}${filename}`;
        
        const response = await fetch(fullPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
            filename,
            data,
            timestamp: new Date()
        };
    }
    
    /**
     * Process loaded data files
     * @param {Array} fileData - Array of loaded file data
     * @returns {Object} Processed and aggregated data
     */
    processDataFiles(fileData) {
        console.log('⚙️ Processing data files...');
        
        this.parsedData = [];
        
        fileData.forEach(({ filename, data, timestamp }) => {
            try {
                const parsed = this.parseDataFile(data, filename);
                if (parsed) {
                    this.parsedData.push(parsed);
                }
            } catch (error) {
                console.error(`Error parsing ${filename}:`, error);
            }
        });
        
        if (this.parsedData.length === 0) {
            console.log('❌ No data could be parsed, using fallback');
            return this.getFallbackData();
        }
        
        console.log(`✅ Successfully parsed ${this.parsedData.length} files`);
        return this.aggregateData();
    }
    
    /**
     * Parse a data file using plugin system
     * @param {Object} data - Raw data
     * @param {string} filename - Filename
     * @returns {Object} Parsed data
     */
    parseDataFile(data, filename) {
        // Use plugin system to parse data
        const parsed = this.pluginManager.parseData(data, filename);
        if (parsed) {
            return parsed;
        } else {
            console.warn(`No plugin could parse ${filename}`);
            return null;
        }
    }
    
    /**
     * Check if data is in SexyDuck format
     * @param {Object} data - Data to check
     * @returns {boolean} True if SexyDuck format
     */
    isSexyDuckFormat(data) {
        return data && 
               data.job_metadata && 
               data.result_data && 
               data.status;
    }
    
    /**
     * Check if data is in standard format
     * @param {Object} data - Data to check
     * @returns {boolean} True if standard format
     */
    isStandardFormat(data) {
        return data && 
               (data.hubName || data.projectName || data.modelName) &&
               (data.totalElements || data.totalViews || data.warningCount);
    }
    
    /**
     * Check if data is array format
     * @param {Object} data - Data to check
     * @returns {boolean} True if array format
     */
    isArrayFormat(data) {
        return Array.isArray(data) && data.length > 0;
    }
    
    /**
     * Parse SexyDuck format data
     * @param {Object} data - SexyDuck data
     * @param {string} filename - Filename
     * @returns {Object} Parsed data
     */
    parseSexyDuckData(data, filename) {
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
            parsedAt: new Date()
        };
    }
    
    /**
     * Parse standard format data
     * @param {Object} data - Standard data
     * @param {string} filename - Filename
     * @returns {Object} Parsed data
     */
    parseStandardData(data, filename) {
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
            parsedAt: new Date()
        };
    }
    
    /**
     * Parse array format data
     * @param {Array} data - Array data
     * @param {string} filename - Filename
     * @returns {Array} Parsed data array
     */
    parseArrayData(data, filename) {
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
            parsedAt: new Date()
        }));
    }
    
    /**
     * Aggregate parsed data
     * @returns {Object} Aggregated data
     */
    aggregateData() {
        console.log('📊 Aggregating data...');
        
        const aggregated = {
            byHub: {},
            byProject: {},
            byModel: {},
            timeSeries: [],
            summary: {}
        };
        
        // Flatten array data if needed
        const flatData = this.parsedData.flat();
        
        flatData.forEach(item => {
            this.aggregateByHub(item, aggregated);
            this.aggregateByProject(item, aggregated);
            this.aggregateByModel(item, aggregated);
            aggregated.timeSeries.push(item);
        });
        
        // Generate summary
        aggregated.summary = this.generateSummary(flatData);
        
        this.aggregatedData = aggregated;
        console.log('✅ Data aggregation complete');
        
        return aggregated;
    }
    
    /**
     * Aggregate data by hub
     * @param {Object} item - Data item
     * @param {Object} aggregated - Aggregated data object
     */
    aggregateByHub(item, aggregated) {
        const hubName = item.hubName;
        if (!aggregated.byHub[hubName]) {
            aggregated.byHub[hubName] = {
                name: hubName,
                projects: new Set(),
                models: new Set(),
                totalFiles: 0,
                totalElements: 0,
                totalViews: 0,
                totalWarnings: 0,
                avgExecutionTime: 0,
                firstSeen: item.timestamp,
                lastSeen: item.timestamp,
                timeSeries: []
            };
        }
        
        const hubData = aggregated.byHub[hubName];
        hubData.projects.add(item.projectName);
        hubData.models.add(item.modelName);
        hubData.totalFiles++;
        hubData.totalElements += item.totalElements;
        hubData.totalViews += item.totalViews;
        hubData.totalWarnings += item.warningCount;
        hubData.avgExecutionTime = (hubData.avgExecutionTime * (hubData.totalFiles - 1) + item.executionTime) / hubData.totalFiles;
        hubData.firstSeen = new Date(Math.min(hubData.firstSeen.getTime(), item.timestamp.getTime()));
        hubData.lastSeen = new Date(Math.max(hubData.lastSeen.getTime(), item.timestamp.getTime()));
        hubData.timeSeries.push(item);
    }
    
    /**
     * Aggregate data by project
     * @param {Object} item - Data item
     * @param {Object} aggregated - Aggregated data object
     */
    aggregateByProject(item, aggregated) {
        const projectKey = `${item.hubName}::${item.projectName}`;
        if (!aggregated.byProject[projectKey]) {
            aggregated.byProject[projectKey] = {
                hubName: item.hubName,
                projectName: item.projectName,
                models: new Set(),
                totalFiles: 0,
                totalElements: 0,
                totalViews: 0,
                totalWarnings: 0,
                avgExecutionTime: 0,
                firstSeen: item.timestamp,
                lastSeen: item.timestamp,
                timeSeries: []
            };
        }
        
        const projectData = aggregated.byProject[projectKey];
        projectData.models.add(item.modelName);
        projectData.totalFiles++;
        projectData.totalElements += item.totalElements;
        projectData.totalViews += item.totalViews;
        projectData.totalWarnings += item.warningCount;
        projectData.avgExecutionTime = (projectData.avgExecutionTime * (projectData.totalFiles - 1) + item.executionTime) / projectData.totalFiles;
        projectData.firstSeen = new Date(Math.min(projectData.firstSeen.getTime(), item.timestamp.getTime()));
        projectData.lastSeen = new Date(Math.max(projectData.lastSeen.getTime(), item.timestamp.getTime()));
        projectData.timeSeries.push(item);
    }
    
    /**
     * Aggregate data by model
     * @param {Object} item - Data item
     * @param {Object} aggregated - Aggregated data object
     */
    aggregateByModel(item, aggregated) {
        const modelKey = `${item.hubName}::${item.projectName}::${item.modelName}`;
        if (!aggregated.byModel[modelKey]) {
            aggregated.byModel[modelKey] = {
                hubName: item.hubName,
                projectName: item.projectName,
                modelName: item.modelName,
                totalFiles: 0,
                totalElements: 0,
                totalViews: 0,
                totalWarnings: 0,
                avgExecutionTime: 0,
                firstSeen: item.timestamp,
                lastSeen: item.timestamp,
                timeSeries: []
            };
        }
        
        const modelData = aggregated.byModel[modelKey];
        modelData.totalFiles++;
        modelData.totalElements += item.totalElements;
        modelData.totalViews += item.totalViews;
        modelData.totalWarnings += item.warningCount;
        modelData.avgExecutionTime = (modelData.avgExecutionTime * (modelData.totalFiles - 1) + item.executionTime) / modelData.totalFiles;
        modelData.firstSeen = new Date(Math.min(modelData.firstSeen.getTime(), item.timestamp.getTime()));
        modelData.lastSeen = new Date(Math.max(modelData.lastSeen.getTime(), item.timestamp.getTime()));
        modelData.timeSeries.push(item);
    }
    
    /**
     * Generate summary statistics
     * @param {Array} data - Flat data array
     * @returns {Object} Summary statistics
     */
    generateSummary(data) {
        const totalFiles = data.length;
        const totalElements = data.reduce((sum, item) => sum + item.totalElements, 0);
        const totalViews = data.reduce((sum, item) => sum + item.totalViews, 0);
        const totalWarnings = data.reduce((sum, item) => sum + item.warningCount, 0);
        const avgExecutionTime = data.reduce((sum, item) => sum + item.executionTime, 0) / totalFiles;
        
        const hubs = [...new Set(data.map(item => item.hubName))];
        const projects = [...new Set(data.map(item => item.projectName))];
        const models = [...new Set(data.map(item => item.modelName))];
        
        const timestamps = data.map(item => item.timestamp);
        const dateRange = {
            earliest: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
            latest: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null
        };
        
        return {
            totalFiles,
            totalElements,
            totalViews,
            totalWarnings,
            avgExecutionTime,
            uniqueHubs: hubs.length,
            uniqueProjects: projects.length,
            uniqueModels: models.length,
            dateRange
        };
    }
    
    /**
     * Get fallback data when no files are found
     * @returns {Object} Fallback data
     */
    getFallbackData() {
        console.log('🔄 Using fallback data...');
        
        const fallbackData = [
            {
                hubName: 'Ennead Architects LLP',
                projectName: '1643_LHH',
                modelName: 'Healthcare Starter Template_in progress',
                timestamp: new Date('2025-10-02T17:15:49.723000'),
                totalElements: 16275,
                totalViews: 277,
                warningCount: 0,
                executionTime: 4.78,
                filename: 'fallback-1',
                parsedAt: new Date()
            },
            {
                hubName: 'Ennead Architects LLP',
                projectName: '1643_LHH',
                modelName: '1643_LHH - Existing',
                timestamp: new Date('2025-10-01T14:30:15.123000'),
                totalElements: 12450,
                totalViews: 198,
                warningCount: 3,
                executionTime: 3.45,
                filename: 'fallback-2',
                parsedAt: new Date()
            },
            {
                hubName: 'Ennead Architects LLP',
                projectName: '1643_LHH',
                modelName: '1643_LHH - New',
                timestamp: new Date('2025-10-01T16:45:30.456000'),
                totalElements: 8930,
                totalViews: 156,
                warningCount: 1,
                executionTime: 2.89,
                filename: 'fallback-3',
                parsedAt: new Date()
            }
        ];
        
        this.parsedData = fallbackData;
        return this.aggregateData();
    }
    
    /**
     * Load data manifest
     * @returns {Promise<Object|null>} Manifest data or null
     */
    async loadDataManifest() {
        try {
            const response = await fetch(`${this.dataPath}manifest.json`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('No manifest file found');
        }
        return null;
    }
    
    /**
     * Get current aggregated data
     * @returns {Object} Current aggregated data
     */
    getAggregatedData() {
        return this.aggregatedData;
    }
    
    /**
     * Get parsed data
     * @returns {Array} Parsed data array
     */
    getParsedData() {
        return this.parsedData;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}
