// Dashboard Application
function DashboardApp() {
    this.data = [];
    this.filteredData = [];
    this.charts = {};
    this.currentSort = { column: null, direction: 'asc' };
    this.init();
}

DashboardApp.prototype.init = async function() {
    this.showLoading();
    
    try {
        await this.loadData();
        this.setupEventListeners();
        this.updateStats();
        this.renderTable();
        this.createComparisonChart();
        this.updateComprehensiveData();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Show error message to user
        this.showError('Failed to load dashboard data. Please refresh the page.');
    } finally {
        // Always hide loading, even if there's an error
        setTimeout(() => {
            this.hideLoading();
        }, 1000); // Minimum 1 second loading time
    }
};

DashboardApp.prototype.loadSexyDuckData = async function() {
    try {
        console.log('🔄 Loading SexyDuck data files...');
        
        // Load manifest to get file list
        const manifestResponse = await fetch('asset/data/manifest.json');
        if (!manifestResponse.ok) {
            throw new Error(`Failed to load manifest: ${manifestResponse.status}`);
        }
        const manifest = await manifestResponse.json();
        
        this.data = [];
        
        // Load each SexyDuck file
        for (const fileInfo of manifest.files) {
            try {
                console.log(`🔄 Loading ${fileInfo.filename}...`);
                const response = await fetch(`asset/data/${fileInfo.filename}`);
                if (!response.ok) {
                    console.warn(`⚠️ Failed to load ${fileInfo.filename}: ${response.status}`);
                    continue;
                }
                const sexDuckData = await response.json();
                
                // Extract and transform the data
                const transformedData = this.transformSexyDuckData(sexDuckData, fileInfo);
                this.data.push(transformedData);
                
            } catch (error) {
                console.warn(`⚠️ Failed to load ${fileInfo.filename}:`, error);
            }
        }
        
        // If no data loaded, show error
        if (this.data.length === 0) {
            console.error('❌ No SexyDuck data loaded');
            throw new Error('No SexyDuck data files could be loaded');
        }
        
        this.filteredData = [...this.data];
        console.log(`✅ Loaded ${this.data.length} SexyDuck files`);
        
    } catch (error) {
        console.error('❌ Error loading SexyDuck data:', error);
        // Show error to user instead of fallback
        this.showError(`Failed to load SexyDuck data: ${error.message}`);
        throw error;
    }
};

DashboardApp.prototype.transformSexyDuckData = function(sexDuckData, fileInfo) {
    const resultData = sexDuckData.result_data || {};
    const jobMetadata = sexDuckData.job_metadata || {};
    
    return {
        // Basic info
        hubName: jobMetadata.hub_name || fileInfo.hub,
        projectName: jobMetadata.project_name || fileInfo.project,
        modelName: jobMetadata.model_name || fileInfo.model,
        timestamp: new Date(jobMetadata.timestamp || fileInfo.timestamp),
        filename: fileInfo.filename,
        
        // Basic metrics
        totalElements: resultData.total_elements || 0,
        totalViews: resultData.views_sheets?.total_views || 0,
        totalSheets: resultData.views_sheets?.total_sheets || 0,
        totalFamilies: resultData.families?.total_families || 0,
        totalRooms: resultData.rooms?.total_rooms || 0,
        warningCount: resultData.warning_count || 0,
        criticalWarningCount: resultData.critical_warning_count || 0,
        viewsNotOnSheets: resultData.views_sheets?.views_not_on_sheets || 0,
        copiedViews: resultData.views_sheets?.copied_views || 0,
        dimensions: resultData.dimensions || 0,
        materials: resultData.materials || 0,
        executionTime: jobMetadata.execution_time_seconds || 0,
        revitVersion: jobMetadata.revit_version || 'Unknown',
        jobId: jobMetadata.job_id || 'Unknown',
        isEnneadTabAvailable: resultData.is_EnneadTab_Available || false,
        status: sexDuckData.status || 'unknown',
        parsedAt: new Date(),
        format: 'SexyDuck',
        
        // Rich data structures
        textNotesInstances: resultData.text_notes_instances || 0,
        textNotesTypes: resultData.text_notes_types || 0,
        dimensionOverrides: resultData.dimension_overrides || 0,
        dimensionTypes: resultData.dimension_types || 0,
        detailGroupTypes: resultData.detail_group_types || 0,
        detailGroupInstances: resultData.detail_group_instances || 0,
        isWorkshared: resultData.project_info?.is_workshared || false,
        projectPhases: resultData.project_info?.project_phases || [],
        
        // Nested data structures
        viewTypes: resultData.views_sheets?.view_types || {},
        warningCategories: resultData.warnings?.warning_categories || {},
        warningDetailsPerUser: resultData.warnings?.warning_details_per_user || {},
        modelGroupUsage: resultData.model_group_usage_analysis || {},
        detailGroupUsage: resultData.detail_group_usage_analysis || {},
        templatesFilters: resultData.templates_filters || {},
        families: resultData.families || {},
        cad_files: resultData.cad_files || {},
        rooms: resultData.rooms || {},
        project_info: resultData.project_info || {},
        
        // Additional metrics
        purgeableElements: resultData.purgeable_elements || 0,
        referencePlanes: resultData.reference_planes || 0,
        linkedFiles: resultData.linked_files || [],
        linkedFilesCount: resultData.linked_files_count || 0,
        revisionClouds: resultData.revision_clouds || 0,
        linePatterns: resultData.line_patterns || 0,
        referencePlanesNoName: resultData.reference_planes_no_name || 0,
        modelGroupTypes: resultData.model_group_types || 0,
        modelGroupInstances: resultData.model_group_instances || 0,
        detailLines: resultData.detail_lines || 0,
        textNotesWidthFactorNot1: resultData.text_notes_width_factor_not_1 || 0,
        textNotesTypesSolidBackground: resultData.text_notes_types_solid_background || 0,
        textNotesAllCaps: resultData.text_notes_all_caps || 0
    };
};

DashboardApp.prototype.loadData = async function() {
    try {
        console.log('🔄 Loading dashboard data...');
        
        // Check if data was preloaded from hero page
        const preloadedData = sessionStorage.getItem('dashboardData');
        if (preloadedData) {
            console.log('✅ Using preloaded data from hero page');
            this.data = JSON.parse(preloadedData).map(item => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }));
            return;
        }
        
        console.log('🔄 No preloaded data found, loading from SexyDuck files...');
        
        // Load actual SexyDuck data files
        await this.loadSexyDuckData();
        return;
    } catch (error) {
        console.error('Error loading data:', error);
        this.showError(`Failed to load data: ${error.message}`);
    }
};

DashboardApp.prototype.setupEventListeners = function() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            this.handleSearch(document.getElementById('searchInput').value);
        });
    }
    
    // Date range filters
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (dateFrom) {
        dateFrom.addEventListener('change', () => {
            this.handleDateFilter();
        });
    }
    
    if (dateTo) {
        dateTo.addEventListener('change', () => {
            this.handleDateFilter();
        });
    }
    
    // Category-based filters
    this.setupCategoryFilters();
    
    // Chart controls
    const chartMetric = document.getElementById('chartMetric');
    const chartGroupBy = document.getElementById('chartGroupBy');
    const comparisonMetric = document.getElementById('comparisonMetric');
    
    if (chartMetric) {
        chartMetric.addEventListener('change', () => {
            this.updateTimeSeriesChart();
        });
    }
    
    if (chartGroupBy) {
        chartGroupBy.addEventListener('change', () => {
            this.updateTimeSeriesChart();
        });
    }
    
    if (comparisonMetric) {
        comparisonMetric.addEventListener('change', () => {
            this.updateComparisonChart();
        });
    }
    
    // Table sorting
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            this.sortTable(header.dataset.sort);
        });
    });
    
    // Navigation
    const backToHero = document.getElementById('backToHero');
    const refreshData = document.getElementById('refreshData');
    
    if (backToHero) {
        console.log('✅ Back to Hero button found, adding event listener');
        backToHero.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Navigating back to hero page');
            try {
                window.location.href = 'index.html';
            } catch (error) {
                console.error('❌ Navigation failed:', error);
                // Fallback: try to go back in history
                window.history.back();
            }
        });
    } else {
        console.error('❌ Back to Hero button not found!');
    }
    
    if (refreshData) {
        refreshData.addEventListener('click', () => {
            this.init();
        });
    }
    
    // Export functionality
    const exportData = document.getElementById('exportData');
    const printData = document.getElementById('printData');
    
    if (exportData) {
        exportData.addEventListener('click', () => {
            this.exportToCSV();
        });
    }
    
    if (printData) {
        printData.addEventListener('click', () => {
            window.print();
        });
    }
    
    // Tree structure interactions
    this.setupTreeInteractions();
};
