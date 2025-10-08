/**
 * HealthMetric Dashboard - Data Configuration
 * Configure data sources, formats, and processing options
 */

const DataConfig = {
    // Data source configuration
    dataSources: {
        // Primary data path
        dataPath: 'asset/data/',
        
        // Manifest file location
        manifestFile: 'manifest.json',
        
        // Supported file formats
        supportedFormats: ['.json', '.sexyDuck', '.csv', '.xml'],
        
        // Auto-discovery settings
        autoDiscovery: {
            enabled: true,
            scanInterval: 30000, // 30 seconds
            recursive: true,
            ignorePatterns: ['.git', 'node_modules', '.DS_Store']
        }
    },
    
    // Data processing configuration
    processing: {
        // Parse options
        parseOptions: {
            dateFormat: 'ISO',
            timezone: 'UTC',
            numberFormat: 'en-US'
        },
        
        // Aggregation settings
        aggregation: {
            groupBy: ['hub', 'project', 'model'],
            timeSeries: {
                interval: 'daily',
                aggregation: 'sum'
            }
        },
        
        // Validation rules
        validation: {
            requiredFields: ['hubName', 'projectName', 'modelName', 'timestamp'],
            optionalFields: ['totalElements', 'totalViews', 'warningCount', 'executionTime'],
            dataTypes: {
                hubName: 'string',
                projectName: 'string',
                modelName: 'string',
                timestamp: 'date',
                totalElements: 'number',
                totalViews: 'number',
                warningCount: 'number',
                executionTime: 'number'
            }
        }
    },
    
    // Format-specific configurations
    formats: {
        SexyDuck: {
            enabled: true,
            mapping: {
                hubName: 'job_metadata.hub_name',
                projectName: 'job_metadata.project_name',
                modelName: 'job_metadata.model_name',
                timestamp: 'job_metadata.timestamp',
                executionTime: 'job_metadata.execution_time_seconds',
                totalElements: 'result_data.total_elements',
                totalViews: 'result_data.total_views',
                totalSheets: 'result_data.total_sheets',
                totalFamilies: 'result_data.total_families',
                totalRooms: 'result_data.total_rooms',
                warningCount: 'result_data.warning_count',
                criticalWarningCount: 'result_data.critical_warning_count',
                viewsNotOnSheets: 'result_data.views_not_on_sheets',
                copiedViews: 'result_data.copied_views',
                unusedViewTemplates: 'result_data.unused_view_templates',
                dimensions: 'result_data.dimensions',
                dimensionOverrides: 'result_data.dimension_overrides',
                textNotesInstances: 'result_data.text_notes_instances',
                detailLines: 'result_data.detail_lines',
                materials: 'result_data.materials',
                isWorkshared: 'result_data.is_workshared',
                projectPhases: 'result_data.project_phases',
                linkedFilesCount: 'result_data.linked_files_count',
                viewTypes: 'result_data.view_types',
                isEnneadTabAvailable: 'result_data.is_EnneadTab_Available'
            }
        },
        
        JSON: {
            enabled: true,
            mapping: {
                hubName: 'hubName',
                projectName: 'projectName',
                modelName: 'modelName',
                timestamp: 'timestamp',
                executionTime: 'executionTime',
                totalElements: 'totalElements',
                totalViews: 'totalViews',
                totalSheets: 'totalSheets',
                totalFamilies: 'totalFamilies',
                totalRooms: 'totalRooms',
                warningCount: 'warningCount',
                criticalWarningCount: 'criticalWarningCount',
                viewsNotOnSheets: 'viewsNotOnSheets',
                copiedViews: 'copiedViews',
                unusedViewTemplates: 'unusedViewTemplates',
                dimensions: 'dimensions',
                dimensionOverrides: 'dimensionOverrides',
                textNotesInstances: 'textNotesInstances',
                detailLines: 'detailLines',
                materials: 'materials',
                isWorkshared: 'isWorkshared',
                projectPhases: 'projectPhases',
                linkedFilesCount: 'linkedFilesCount',
                viewTypes: 'viewTypes',
                isEnneadTabAvailable: 'isEnneadTabAvailable'
            }
        },
        
        CSV: {
            enabled: false, // Not implemented yet
            mapping: {},
            delimiter: ',',
            headers: true
        },
        
        XML: {
            enabled: false, // Not implemented yet
            mapping: {},
            rootElement: 'data',
            itemElement: 'record'
        }
    },
    
    // Dashboard display configuration
    display: {
        // Default chart settings
        charts: {
            timeSeries: {
                type: 'line',
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            comparison: {
                type: 'bar',
                duration: 1500,
                easing: 'easeOutQuart'
            }
        },
        
        // Table settings
        table: {
            pageSize: 50,
            sortable: true,
            filterable: true,
            exportable: true
        },
        
        // Search settings
        search: {
            debounce: 300,
            minLength: 2,
            highlight: true
        }
    },
    
    // Performance settings
    performance: {
        // Caching
        cache: {
            enabled: true,
            duration: 300000, // 5 minutes
            maxSize: 50 * 1024 * 1024 // 50MB
        },
        
        // Lazy loading
        lazyLoading: {
            enabled: true,
            threshold: 100,
            batchSize: 20
        },
        
        // Data processing
        processing: {
            batchSize: 100,
            timeout: 30000, // 30 seconds
            retries: 3
        }
    },
    
    // Error handling
    errorHandling: {
        // Fallback data
        fallback: {
            enabled: true,
            data: [
                {
                    hubName: 'Ennead Architects LLP',
                    projectName: '1643_LHH',
                    modelName: 'Healthcare Starter Template_in progress',
                    timestamp: new Date('2025-10-02T17:15:49.723000'),
                    totalElements: 16275,
                    totalViews: 277,
                    warningCount: 0,
                    executionTime: 4.78
                }
            ]
        },
        
        // Error reporting
        reporting: {
            enabled: true,
            logLevel: 'error',
            showUserMessages: true
        }
    },
    
    // Custom data sources
    customSources: {
        // Add custom data sources here
        // Example:
        // api: {
        //     enabled: false,
        //     endpoint: 'https://api.example.com/data',
        //     method: 'GET',
        //     headers: {
        //         'Authorization': 'Bearer token'
        //     }
        // }
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataConfig;
}
