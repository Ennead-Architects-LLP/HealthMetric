/**
 * HealthMetric Dashboard - Data Parser
 * Parse SexyDuck JSON files and extract metrics
 */

class DataParser {
    constructor() {
        this.parsedData = [];
        this.aggregatedData = {
            byHub: {},
            byProject: {},
            byModel: {},
            timeSeries: []
        };
    }
    
    /**
     * Parse a single SexyDuck JSON file
     * @param {Object} jsonData - The JSON data from a SexyDuck file
     * @param {string} filename - The original filename
     * @returns {Object} Parsed data object
     */
    parseFile(jsonData, filename) {
        try {
            const parsed = {
                // Job metadata
                hubName: jsonData.job_metadata?.hub_name || 'Unknown',
                projectName: jsonData.job_metadata?.project_name || 'Unknown',
                modelName: jsonData.job_metadata?.model_name || 'Unknown',
                timestamp: new Date(jsonData.job_metadata?.timestamp || Date.now()),
                executionTime: jsonData.job_metadata?.execution_time_seconds || 0,
                revitVersion: jsonData.job_metadata?.revit_version || 'Unknown',
                jobId: jsonData.job_metadata?.job_id || 'Unknown',
                
                // Result data metrics
                metrics: {
                    // Basic counts
                    totalElements: jsonData.result_data?.total_elements || 0,
                    totalViews: jsonData.result_data?.total_views || 0,
                    totalSheets: jsonData.result_data?.total_sheets || 0,
                    totalFamilies: jsonData.result_data?.total_families || 0,
                    totalRooms: jsonData.result_data?.total_rooms || 0,
                    
                    // Warning metrics
                    warningCount: jsonData.result_data?.warning_count || 0,
                    criticalWarningCount: jsonData.result_data?.critical_warning_count || 0,
                    warningCountPerUser: jsonData.result_data?.warning_count_per_user || {},
                    warningDetailsPerUser: jsonData.result_data?.warning_details_per_user || {},
                    
                    // View metrics
                    viewsNotOnSheets: jsonData.result_data?.views_not_on_sheets || 0,
                    copiedViews: jsonData.result_data?.copied_views || 0,
                    unusedViewTemplates: jsonData.result_data?.unused_view_templates || 0,
                    
                    // Element metrics
                    dimensions: jsonData.result_data?.dimensions || 0,
                    dimensionOverrides: jsonData.result_data?.dimension_overrides || 0,
                    textNotesInstances: jsonData.result_data?.text_notes_instances || 0,
                    detailLines: jsonData.result_data?.detail_lines || 0,
                    materials: jsonData.result_data?.materials || 0,
                    
                    // Project info
                    isWorkshared: jsonData.result_data?.is_workshared || false,
                    projectPhases: jsonData.result_data?.project_phases || [],
                    linkedFilesCount: jsonData.result_data?.linked_files_count || 0,
                    
                    // View types breakdown
                    viewTypes: jsonData.result_data?.view_types || {},
                    
                    // Group analysis
                    detailGroupUsage: jsonData.result_data?.detail_group_usage_analysis || {},
                    modelGroupUsage: jsonData.result_data?.model_group_usage_analysis || {},
                    
                    // EnneadTab specific
                    isEnneadTabAvailable: jsonData.result_data?.is_EnneadTab_Available || false
                },
                
                // Status
                status: jsonData.status || 'unknown',
                
                // Original filename
                filename: filename,
                
                // Parse timestamp
                parsedAt: new Date()
            };
            
            return parsed;
        } catch (error) {
            console.error('Error parsing file:', filename, error);
            return null;
        }
    }
    
    /**
     * Parse multiple files and aggregate data
     * @param {Array} filesData - Array of {data, filename} objects
     * @returns {Object} Aggregated data
     */
    parseMultipleFiles(filesData) {
        this.parsedData = [];
        this.aggregatedData = {
            byHub: {},
            byProject: {},
            byModel: {},
            timeSeries: []
        };
        
        filesData.forEach(({ data, filename }) => {
            const parsed = this.parseFile(data, filename);
            if (parsed) {
                this.parsedData.push(parsed);
                this.aggregateData(parsed);
            }
        });
        
        return {
            parsedData: this.parsedData,
            aggregatedData: this.aggregatedData,
            summary: this.generateSummary()
        };
    }
    
    /**
     * Aggregate data by different dimensions
     * @param {Object} parsed - Parsed data object
     */
    aggregateData(parsed) {
        const { hubName, projectName, modelName, timestamp, metrics } = parsed;
        
        // Aggregate by Hub
        if (!this.aggregatedData.byHub[hubName]) {
            this.aggregatedData.byHub[hubName] = {
                name: hubName,
                projects: new Set(),
                models: new Set(),
                totalFiles: 0,
                totalElements: 0,
                totalViews: 0,
                totalWarnings: 0,
                avgExecutionTime: 0,
                firstSeen: timestamp,
                lastSeen: timestamp,
                timeSeries: []
            };
        }
        
        const hubData = this.aggregatedData.byHub[hubName];
        hubData.projects.add(projectName);
        hubData.models.add(modelName);
        hubData.totalFiles++;
        hubData.totalElements += metrics.totalElements;
        hubData.totalViews += metrics.totalViews;
        hubData.totalWarnings += metrics.warningCount;
        hubData.avgExecutionTime = (hubData.avgExecutionTime * (hubData.totalFiles - 1) + parsed.executionTime) / hubData.totalFiles;
        hubData.firstSeen = new Date(Math.min(hubData.firstSeen.getTime(), timestamp.getTime()));
        hubData.lastSeen = new Date(Math.max(hubData.lastSeen.getTime(), timestamp.getTime()));
        hubData.timeSeries.push({
            timestamp,
            totalElements: metrics.totalElements,
            totalViews: metrics.totalViews,
            warningCount: metrics.warningCount,
            executionTime: parsed.executionTime
        });
        
        // Aggregate by Project
        const projectKey = `${hubName}::${projectName}`;
        if (!this.aggregatedData.byProject[projectKey]) {
            this.aggregatedData.byProject[projectKey] = {
                hubName,
                projectName,
                models: new Set(),
                totalFiles: 0,
                totalElements: 0,
                totalViews: 0,
                totalWarnings: 0,
                avgExecutionTime: 0,
                firstSeen: timestamp,
                lastSeen: timestamp,
                timeSeries: []
            };
        }
        
        const projectData = this.aggregatedData.byProject[projectKey];
        projectData.models.add(modelName);
        projectData.totalFiles++;
        projectData.totalElements += metrics.totalElements;
        projectData.totalViews += metrics.totalViews;
        projectData.totalWarnings += metrics.warningCount;
        projectData.avgExecutionTime = (projectData.avgExecutionTime * (projectData.totalFiles - 1) + parsed.executionTime) / projectData.totalFiles;
        projectData.firstSeen = new Date(Math.min(projectData.firstSeen.getTime(), timestamp.getTime()));
        projectData.lastSeen = new Date(Math.max(projectData.lastSeen.getTime(), timestamp.getTime()));
        projectData.timeSeries.push({
            timestamp,
            modelName,
            totalElements: metrics.totalElements,
            totalViews: metrics.totalViews,
            warningCount: metrics.warningCount,
            executionTime: parsed.executionTime
        });
        
        // Aggregate by Model
        const modelKey = `${hubName}::${projectName}::${modelName}`;
        if (!this.aggregatedData.byModel[modelKey]) {
            this.aggregatedData.byModel[modelKey] = {
                hubName,
                projectName,
                modelName,
                totalFiles: 0,
                totalElements: 0,
                totalViews: 0,
                totalWarnings: 0,
                avgExecutionTime: 0,
                firstSeen: timestamp,
                lastSeen: timestamp,
                timeSeries: []
            };
        }
        
        const modelData = this.aggregatedData.byModel[modelKey];
        modelData.totalFiles++;
        modelData.totalElements += metrics.totalElements;
        modelData.totalViews += metrics.totalViews;
        modelData.totalWarnings += metrics.warningCount;
        modelData.avgExecutionTime = (modelData.avgExecutionTime * (modelData.totalFiles - 1) + parsed.executionTime) / modelData.totalFiles;
        modelData.firstSeen = new Date(Math.min(modelData.firstSeen.getTime(), timestamp.getTime()));
        modelData.lastSeen = new Date(Math.max(modelData.lastSeen.getTime(), timestamp.getTime()));
        modelData.timeSeries.push({
            timestamp,
            totalElements: metrics.totalElements,
            totalViews: metrics.totalViews,
            warningCount: metrics.warningCount,
            executionTime: parsed.executionTime
        });
        
        // Global time series
        this.aggregatedData.timeSeries.push({
            timestamp,
            hubName,
            projectName,
            modelName,
            totalElements: metrics.totalElements,
            totalViews: metrics.totalViews,
            warningCount: metrics.warningCount,
            executionTime: parsed.executionTime
        });
    }
    
    /**
     * Generate summary statistics
     * @returns {Object} Summary data
     */
    generateSummary() {
        const totalFiles = this.parsedData.length;
        const totalElements = this.parsedData.reduce((sum, item) => sum + item.metrics.totalElements, 0);
        const totalViews = this.parsedData.reduce((sum, item) => sum + item.metrics.totalViews, 0);
        const totalWarnings = this.parsedData.reduce((sum, item) => sum + item.metrics.warningCount, 0);
        const avgExecutionTime = this.parsedData.reduce((sum, item) => sum + item.executionTime, 0) / totalFiles;
        
        const hubs = Object.keys(this.aggregatedData.byHub);
        const projects = Object.keys(this.aggregatedData.byProject);
        const models = Object.keys(this.aggregatedData.byModel);
        
        return {
            totalFiles,
            totalElements,
            totalViews,
            totalWarnings,
            avgExecutionTime,
            uniqueHubs: hubs.length,
            uniqueProjects: projects.length,
            uniqueModels: models.length,
            dateRange: {
                earliest: this.parsedData.length > 0 ? 
                    new Date(Math.min(...this.parsedData.map(item => item.timestamp.getTime()))) : null,
                latest: this.parsedData.length > 0 ? 
                    new Date(Math.max(...this.parsedData.map(item => item.timestamp.getTime()))) : null
            }
        };
    }
    
    /**
     * Get time series data for charts
     * @param {string} groupBy - 'hub', 'project', or 'model'
     * @param {string} metric - Metric to track
     * @param {string} timeRange - Time range filter
     * @returns {Array} Time series data
     */
    getTimeSeriesData(groupBy = 'hub', metric = 'totalElements', timeRange = 'all') {
        let data = [];
        
        switch (groupBy) {
            case 'hub':
                data = Object.values(this.aggregatedData.byHub).map(hub => ({
                    name: hub.name,
                    timeSeries: hub.timeSeries.map(point => ({
                        timestamp: point.timestamp,
                        value: point[metric] || 0
                    }))
                }));
                break;
            case 'project':
                data = Object.values(this.aggregatedData.byProject).map(project => ({
                    name: `${project.hubName} - ${project.projectName}`,
                    timeSeries: project.timeSeries.map(point => ({
                        timestamp: point.timestamp,
                        value: point[metric] || 0
                    }))
                }));
                break;
            case 'model':
                data = Object.values(this.aggregatedData.byModel).map(model => ({
                    name: `${model.hubName} - ${model.projectName} - ${model.modelName}`,
                    timeSeries: model.timeSeries.map(point => ({
                        timestamp: point.timestamp,
                        value: point[metric] || 0
                    }))
                }));
                break;
        }
        
        // Apply time range filter
        if (timeRange !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            
            switch (timeRange) {
                case '7d':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    filterDate.setDate(now.getDate() - 30);
                    break;
                case '90d':
                    filterDate.setDate(now.getDate() - 90);
                    break;
            }
            
            data = data.map(item => ({
                ...item,
                timeSeries: item.timeSeries.filter(point => point.timestamp >= filterDate)
            }));
        }
        
        return data;
    }
    
    /**
     * Get filtered data based on search criteria
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered data
     */
    getFilteredData(filters = {}) {
        let filtered = [...this.parsedData];
        
        if (filters.hubName) {
            filtered = filtered.filter(item => 
                item.hubName.toLowerCase().includes(filters.hubName.toLowerCase())
            );
        }
        
        if (filters.projectName) {
            filtered = filtered.filter(item => 
                item.projectName.toLowerCase().includes(filters.projectName.toLowerCase())
            );
        }
        
        if (filters.modelName) {
            filtered = filtered.filter(item => 
                item.modelName.toLowerCase().includes(filters.modelName.toLowerCase())
            );
        }
        
        if (filters.dateFrom) {
            filtered = filtered.filter(item => item.timestamp >= new Date(filters.dateFrom));
        }
        
        if (filters.dateTo) {
            filtered = filtered.filter(item => item.timestamp <= new Date(filters.dateTo));
        }
        
        if (filters.minElements) {
            filtered = filtered.filter(item => item.metrics.totalElements >= filters.minElements);
        }
        
        if (filters.maxElements) {
            filtered = filtered.filter(item => item.metrics.totalElements <= filters.maxElements);
        }
        
        return filtered;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataParser;
}
