/**
 * HealthMetric Dashboard - Data Aggregator
 * Aggregate and process data from multiple SexyDuck files
 */

class DataAggregator {
    constructor() {
        this.aggregatedData = {
            byHub: {},
            byProject: {},
            byModel: {},
            timeSeries: [],
            summary: {}
        };
    }
    
    /**
     * Aggregate data from parsed files
     * @param {Array} parsedFiles - Array of parsed data objects
     * @returns {Object} Aggregated data
     */
    aggregateData(parsedFiles) {
        this.reset();
        
        parsedFiles.forEach(fileData => {
            this.processFileData(fileData);
        });
        
        this.generateSummary();
        this.processTimeSeries();
        
        return this.aggregatedData;
    }
    
    /**
     * Process individual file data
     * @param {Object} fileData - Parsed file data
     */
    processFileData(fileData) {
        const { hubName, projectName, modelName, timestamp, metrics } = fileData;
        
        // Aggregate by Hub
        this.aggregateByHub(hubName, projectName, modelName, timestamp, metrics);
        
        // Aggregate by Project
        this.aggregateByProject(hubName, projectName, modelName, timestamp, metrics);
        
        // Aggregate by Model
        this.aggregateByModel(hubName, projectName, modelName, timestamp, metrics);
        
        // Add to time series
        this.aggregatedData.timeSeries.push({
            timestamp,
            hubName,
            projectName,
            modelName,
            ...metrics
        });
    }
    
    /**
     * Aggregate data by hub
     */
    aggregateByHub(hubName, projectName, modelName, timestamp, metrics) {
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
        hubData.avgExecutionTime = (hubData.avgExecutionTime * (hubData.totalFiles - 1) + metrics.executionTime) / hubData.totalFiles;
        hubData.firstSeen = new Date(Math.min(hubData.firstSeen.getTime(), timestamp.getTime()));
        hubData.lastSeen = new Date(Math.max(hubData.lastSeen.getTime(), timestamp.getTime()));
        
        hubData.timeSeries.push({
            timestamp,
            projectName,
            modelName,
            totalElements: metrics.totalElements,
            totalViews: metrics.totalViews,
            warningCount: metrics.warningCount,
            executionTime: metrics.executionTime
        });
    }
    
    /**
     * Aggregate data by project
     */
    aggregateByProject(hubName, projectName, modelName, timestamp, metrics) {
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
        projectData.avgExecutionTime = (projectData.avgExecutionTime * (projectData.totalFiles - 1) + metrics.executionTime) / projectData.totalFiles;
        projectData.firstSeen = new Date(Math.min(projectData.firstSeen.getTime(), timestamp.getTime()));
        projectData.lastSeen = new Date(Math.max(projectData.lastSeen.getTime(), timestamp.getTime()));
        
        projectData.timeSeries.push({
            timestamp,
            modelName,
            totalElements: metrics.totalElements,
            totalViews: metrics.totalViews,
            warningCount: metrics.warningCount,
            executionTime: metrics.executionTime
        });
    }
    
    /**
     * Aggregate data by model
     */
    aggregateByModel(hubName, projectName, modelName, timestamp, metrics) {
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
        modelData.avgExecutionTime = (modelData.avgExecutionTime * (modelData.totalFiles - 1) + metrics.executionTime) / modelData.totalFiles;
        modelData.firstSeen = new Date(Math.min(modelData.firstSeen.getTime(), timestamp.getTime()));
        modelData.lastSeen = new Date(Math.max(modelData.lastSeen.getTime(), timestamp.getTime()));
        
        modelData.timeSeries.push({
            timestamp,
            totalElements: metrics.totalElements,
            totalViews: metrics.totalViews,
            warningCount: metrics.warningCount,
            executionTime: metrics.executionTime
        });
    }
    
    /**
     * Generate summary statistics
     */
    generateSummary() {
        const hubs = Object.keys(this.aggregatedData.byHub);
        const projects = Object.keys(this.aggregatedData.byProject);
        const models = Object.keys(this.aggregatedData.byModel);
        
        const totalFiles = this.aggregatedData.timeSeries.length;
        const totalElements = this.aggregatedData.timeSeries.reduce((sum, item) => sum + item.totalElements, 0);
        const totalViews = this.aggregatedData.timeSeries.reduce((sum, item) => sum + item.totalViews, 0);
        const totalWarnings = this.aggregatedData.timeSeries.reduce((sum, item) => sum + item.warningCount, 0);
        const avgExecutionTime = this.aggregatedData.timeSeries.reduce((sum, item) => sum + item.executionTime, 0) / totalFiles;
        
        const timestamps = this.aggregatedData.timeSeries.map(item => item.timestamp);
        const dateRange = {
            earliest: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
            latest: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null
        };
        
        this.aggregatedData.summary = {
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
     * Process time series data for charts
     */
    processTimeSeries() {
        // Sort time series by timestamp
        this.aggregatedData.timeSeries.sort((a, b) => a.timestamp - b.timestamp);
        
        // Group by week for weekly trends
        this.aggregatedData.weeklyTrends = this.groupByWeek(this.aggregatedData.timeSeries);
        
        // Group by month for monthly trends
        this.aggregatedData.monthlyTrends = this.groupByMonth(this.aggregatedData.timeSeries);
    }
    
    /**
     * Group time series data by week (Monday-based)
     * All data from the same week (Mon-Sun) is grouped under the Monday date
     * This matches the data file naming convention where weekly data files are prefixed with the Monday date
     * @param {Array} timeSeries - Time series data
     * @returns {Object} Weekly grouped data
     */
    groupByWeek(timeSeries) {
        const weeklyData = {};
        
        timeSeries.forEach(item => {
            const weekStart = this.getWeekStart(item.timestamp);
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                    weekStart,
                    hubData: {},
                    totalElements: 0,
                    totalViews: 0,
                    totalWarnings: 0,
                    fileCount: 0
                };
            }
            
            const weekData = weeklyData[weekKey];
            weekData.totalElements += item.totalElements;
            weekData.totalViews += item.totalViews;
            weekData.totalWarnings += item.warningCount;
            weekData.fileCount++;
            
            // Group by hub
            if (!weekData.hubData[item.hubName]) {
                weekData.hubData[item.hubName] = {
                    totalElements: 0,
                    totalViews: 0,
                    totalWarnings: 0,
                    fileCount: 0
                };
            }
            
            const hubData = weekData.hubData[item.hubName];
            hubData.totalElements += item.totalElements;
            hubData.totalViews += item.totalViews;
            hubData.totalWarnings += item.warningCount;
            hubData.fileCount++;
        });
        
        return weeklyData;
    }
    
    /**
     * Group time series data by month
     * @param {Array} timeSeries - Time series data
     * @returns {Object} Monthly grouped data
     */
    groupByMonth(timeSeries) {
        const monthlyData = {};
        
        timeSeries.forEach(item => {
            const monthStart = new Date(item.timestamp.getFullYear(), item.timestamp.getMonth(), 1);
            const monthKey = monthStart.toISOString().split('T')[0];
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    monthStart,
                    hubData: {},
                    totalElements: 0,
                    totalViews: 0,
                    totalWarnings: 0,
                    fileCount: 0
                };
            }
            
            const monthData = monthlyData[monthKey];
            monthData.totalElements += item.totalElements;
            monthData.totalViews += item.totalViews;
            monthData.totalWarnings += item.warningCount;
            monthData.fileCount++;
            
            // Group by hub
            if (!monthData.hubData[item.hubName]) {
                monthData.hubData[item.hubName] = {
                    totalElements: 0,
                    totalViews: 0,
                    totalWarnings: 0,
                    fileCount: 0
                };
            }
            
            const hubData = monthData.hubData[item.hubName];
            hubData.totalElements += item.totalElements;
            hubData.totalViews += item.totalViews;
            hubData.totalWarnings += item.warningCount;
            hubData.fileCount++;
        });
        
        return monthlyData;
    }
    
    /**
     * Get the start of the week (Monday) for a given date
     * All data from Monday-Sunday will be grouped under that Monday's date
     * @param {Date} date - Input date (any day of the week)
     * @returns {Date} Monday of that week (at midnight)
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (start week on Monday)
        return new Date(d.setDate(diff));
    }
    
    /**
     * Get time series data for charts
     * @param {string} groupBy - 'hub', 'project', or 'model'
     * @param {string} metric - Metric to track
     * @param {string} timeRange - Time range filter
     * @returns {Array} Chart-ready data
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
     * Get filtered data based on criteria
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered data
     */
    getFilteredData(filters = {}) {
        let filtered = [...this.aggregatedData.timeSeries];
        
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
            filtered = filtered.filter(item => item.totalElements >= filters.minElements);
        }
        
        if (filters.maxElements) {
            filtered = filtered.filter(item => item.totalElements <= filters.maxElements);
        }
        
        return filtered;
    }
    
    /**
     * Reset aggregated data
     */
    reset() {
        this.aggregatedData = {
            byHub: {},
            byProject: {},
            byModel: {},
            timeSeries: [],
            summary: {}
        };
    }
    
    /**
     * Export aggregated data as JSON
     * @returns {string} JSON string
     */
    exportAsJSON() {
        return JSON.stringify(this.aggregatedData, null, 2);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataAggregator;
}
