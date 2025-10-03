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

// Add missing methods that are called by updateComprehensiveData
DashboardApp.prototype.updateModelStructure = function() {
    console.log('🔧 updateModelStructure called');
    const viewBreakdownEl = document.getElementById('viewBreakdown');
    const elementBreakdownEl = document.getElementById('elementBreakdown');
    
    if (!viewBreakdownEl || !elementBreakdownEl) return;
    
    // Aggregate view types
    const viewTypes = {};
    const elementCounts = {
        totalElements: 0,
        totalViews: 0,
        totalSheets: 0,
        totalFamilies: 0,
        dimensions: 0,
        materials: 0,
        textNotesInstances: 0
    };
    
    this.filteredData.forEach(item => {
        // Aggregate available data
        elementCounts.totalElements += item.totalElements || 0;
        elementCounts.totalViews += item.totalViews || 0;
        elementCounts.totalSheets += item.totalSheets || 0;
        elementCounts.totalFamilies += item.totalFamilies || 0;
        elementCounts.dimensions += item.dimensions || 0;
        elementCounts.materials += item.materials || 0;
        elementCounts.textNotesInstances += item.textNotesInstances || 0;
    });
    
    // Display model summary
    viewBreakdownEl.innerHTML = `
        <div class="view-type">
            <span class="view-type-name">Models Analyzed</span>
            <span class="view-type-count">${this.filteredData.length}</span>
        </div>
        <div class="view-type">
            <span class="view-type-name">Total Views</span>
            <span class="view-type-count">${elementCounts.totalViews}</span>
        </div>
        <div class="view-type">
            <span class="view-type-name">Total Sheets</span>
            <span class="view-type-count">${elementCounts.totalSheets}</span>
        </div>
    `;
    
    // Display element breakdown
    elementBreakdownEl.innerHTML = Object.entries(elementCounts)
        .map(([element, count]) => `
            <div class="element-count">
                <span class="element-name">${element.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <span class="element-value">${count.toLocaleString()}</span>
            </div>
        `).join('');
};

// Add other missing methods
DashboardApp.prototype.updateFamiliesAnalysis = function() {
    const familiesAnalysisEl = document.getElementById('familiesAnalysis');
    if (!familiesAnalysisEl) return;
    
    // Aggregate families data
    const familiesData = {
        totalFamilies: 0,
        nonParametricFamilies: 0,
        inPlaceFamilies: 0,
        detailComponents: 0,
        genericModelsTypes: 0,
        familyCreators: {}
    };
    
    this.filteredData.forEach(item => {
        if (item.families) {
            familiesData.totalFamilies += item.families.total_families || 0;
            familiesData.nonParametricFamilies += item.families.non_parametric_families || 0;
            familiesData.inPlaceFamilies += item.families.in_place_families || 0;
            familiesData.detailComponents += item.families.detail_components || 0;
            familiesData.genericModelsTypes += item.families.generic_models_types || 0;
            
            // Aggregate family creators
            if (item.families.non_parametric_families_creators) {
                Object.entries(item.families.non_parametric_families_creators).forEach(([creator, count]) => {
                    familiesData.familyCreators[creator] = (familiesData.familyCreators[creator] || 0) + count;
                });
            }
        }
    });
    
    familiesAnalysisEl.innerHTML = `
        <div class="families-stats">
            <div class="family-stat">
                <span class="stat-label">Total Families</span>
                <span class="stat-value">${familiesData.totalFamilies}</span>
            </div>
            <div class="family-stat">
                <span class="stat-label">Non-Parametric</span>
                <span class="stat-value">${familiesData.nonParametricFamilies}</span>
            </div>
            <div class="family-stat">
                <span class="stat-label">In-Place Families</span>
                <span class="stat-value">${familiesData.inPlaceFamilies}</span>
            </div>
            <div class="family-stat">
                <span class="stat-label">Detail Components</span>
                <span class="stat-value">${familiesData.detailComponents}</span>
            </div>
            <div class="family-stat">
                <span class="stat-label">Generic Models</span>
                <span class="stat-value">${familiesData.genericModelsTypes}</span>
            </div>
        </div>
        ${Object.keys(familiesData.familyCreators).length > 0 ? `
            <div class="family-creators">
                <h5>Family Creators</h5>
                ${Object.entries(familiesData.familyCreators)
                    .sort(([,a], [,b]) => b - a)
                    .map(([creator, count]) => `
                        <div class="creator-stat">
                            <span class="creator-name">${creator}</span>
                            <span class="creator-count">${count} families</span>
                        </div>
                    `).join('')}
            </div>
        ` : ''}
    `;
};

DashboardApp.prototype.updateGroupUsage = function() {
    const groupUsageEl = document.getElementById('groupUsage');
    if (!groupUsageEl) return;
    
    // Calculate basic metrics from available data
    const totalModels = this.filteredData.length;
    const totalElements = this.filteredData.reduce((sum, item) => sum + (item.totalElements || 0), 0);
    const totalFamilies = this.filteredData.reduce((sum, item) => sum + (item.totalFamilies || 0), 0);
    const avgElementsPerModel = totalModels > 0 ? (totalElements / totalModels).toFixed(0) : 0;
    
    groupUsageEl.innerHTML = `
        <div class="group-stats">
            <div class="group-stat">
                <span class="stat-label">TOTAL MODELS</span>
                <span class="stat-value">${totalModels}</span>
            </div>
            <div class="group-stat">
                <span class="stat-label">TOTAL ELEMENTS</span>
                <span class="stat-value">${totalElements.toLocaleString()}</span>
            </div>
            <div class="group-stat">
                <span class="stat-label">TOTAL FAMILIES</span>
                <span class="stat-value">${totalFamilies}</span>
            </div>
            <div class="group-stat">
                <span class="stat-label">AVG ELEMENTS/MODEL</span>
                <span class="stat-value">${avgElementsPerModel}</span>
            </div>
        </div>
    `;
};

DashboardApp.prototype.updateTemplatesFilters = function() {
    const templatesFiltersEl = document.getElementById('templatesFilters');
    if (!templatesFiltersEl) return;
    
    // Calculate view and sheet metrics from available data
    const totalViews = this.filteredData.reduce((sum, item) => sum + (item.totalViews || 0), 0);
    const totalSheets = this.filteredData.reduce((sum, item) => sum + (item.totalSheets || 0), 0);
    const viewsNotOnSheets = this.filteredData.reduce((sum, item) => sum + (item.viewsNotOnSheets || 0), 0);
    const copiedViews = this.filteredData.reduce((sum, item) => sum + (item.copiedViews || 0), 0);
    
    templatesFiltersEl.innerHTML = `
        <div class="templates-stats">
            <div class="template-stat">
                <span class="stat-label">Total Views</span>
                <span class="stat-value">${totalViews}</span>
            </div>
            <div class="template-stat">
                <span class="stat-label">Total Sheets</span>
                <span class="stat-value">${totalSheets}</span>
            </div>
            <div class="template-stat">
                <span class="stat-label">Views Not on Sheets</span>
                <span class="stat-value">${viewsNotOnSheets}</span>
            </div>
            <div class="template-stat">
                <span class="stat-label">Copied Views</span>
                <span class="stat-value">${copiedViews}</span>
            </div>
        </div>
    `;
};

DashboardApp.prototype.updateCADFilesAnalysis = function() {
    const cadFilesAnalysisEl = document.getElementById('cadFilesAnalysis');
    if (!cadFilesAnalysisEl) return;
    
    // Aggregate CAD files data
    const cadData = {
        importedDwgs: 0,
        linkedDwgs: 0,
        dwgFiles: 0,
        cadLayersImportsInFamilies: 0
    };
    
    this.filteredData.forEach(item => {
        if (item.cad_files) {
            cadData.importedDwgs += item.cad_files.imported_dwgs || 0;
            cadData.linkedDwgs += item.cad_files.linked_dwgs || 0;
            cadData.dwgFiles += item.cad_files.dwg_files || 0;
            cadData.cadLayersImportsInFamilies += item.cad_files.cad_layers_imports_in_families || 0;
        }
    });
    
    cadFilesAnalysisEl.innerHTML = `
        <div class="cad-stats">
            <div class="cad-stat">
                <span class="stat-label">Imported DWGs</span>
                <span class="stat-value">${cadData.importedDwgs}</span>
            </div>
            <div class="cad-stat">
                <span class="stat-label">Linked DWGs</span>
                <span class="stat-value">${cadData.linkedDwgs}</span>
            </div>
            <div class="cad-stat">
                <span class="stat-label">DWG Files</span>
                <span class="stat-value">${cadData.dwgFiles}</span>
            </div>
            <div class="cad-stat">
                <span class="stat-label">CAD Layers in Families</span>
                <span class="stat-value">${cadData.cadLayersImportsInFamilies}</span>
            </div>
        </div>
    `;
};

DashboardApp.prototype.updateRoomsAnalysis = function() {
    const roomsAnalysisEl = document.getElementById('roomsAnalysis');
    if (!roomsAnalysisEl) return;
    
    // Aggregate rooms data
    const roomsData = {
        totalRooms: 0,
        unplacedRooms: 0,
        unboundedRooms: 0
    };
    
    this.filteredData.forEach(item => {
        if (item.rooms) {
            roomsData.totalRooms += item.rooms.total_rooms || 0;
            roomsData.unplacedRooms += item.rooms.unplaced_rooms || 0;
            roomsData.unboundedRooms += item.rooms.unbounded_rooms || 0;
        }
    });
    
    roomsAnalysisEl.innerHTML = `
        <div class="rooms-stats">
            <div class="room-stat">
                <span class="stat-label">Total Rooms</span>
                <span class="stat-value">${roomsData.totalRooms}</span>
            </div>
            <div class="room-stat">
                <span class="stat-label">Unplaced Rooms</span>
                <span class="stat-value">${roomsData.unplacedRooms}</span>
            </div>
            <div class="room-stat">
                <span class="stat-label">Unbounded Rooms</span>
                <span class="stat-value">${roomsData.unboundedRooms}</span>
            </div>
        </div>
    `;
};

DashboardApp.prototype.updateWorksetsAnalysis = function() {
    const worksetsAnalysisEl = document.getElementById('worksetsAnalysis');
    if (!worksetsAnalysisEl) return;
    
    // Aggregate worksets data
    const worksetsData = {
        totalWorksets: 0,
        userWorksets: 0,
        standardWorksets: 0,
        worksetOwners: {}
    };
    
    this.filteredData.forEach(item => {
        if (item.project_info && item.project_info.worksets) {
            const worksets = item.project_info.worksets.workset_details || [];
            worksetsData.totalWorksets += worksets.length;
            
            worksets.forEach(workset => {
                if (workset.kind === 'UserWorkset') {
                    worksetsData.userWorksets++;
                } else if (workset.kind === 'StandardWorkset') {
                    worksetsData.standardWorksets++;
                }
                
                if (workset.owner) {
                    worksetsData.worksetOwners[workset.owner] = (worksetsData.worksetOwners[workset.owner] || 0) + 1;
                }
            });
        }
    });
    
    worksetsAnalysisEl.innerHTML = `
        <div class="worksets-stats">
            <div class="workset-stat">
                <span class="stat-label">Total Worksets</span>
                <span class="stat-value">${worksetsData.totalWorksets}</span>
            </div>
            <div class="workset-stat">
                <span class="stat-label">User Worksets</span>
                <span class="stat-value">${worksetsData.userWorksets}</span>
            </div>
            <div class="workset-stat">
                <span class="stat-label">Standard Worksets</span>
                <span class="stat-value">${worksetsData.standardWorksets}</span>
            </div>
        </div>
        ${Object.keys(worksetsData.worksetOwners).length > 0 ? `
            <div class="workset-owners">
                <h5>Workset Owners</h5>
                ${Object.entries(worksetsData.worksetOwners)
                    .sort(([,a], [,b]) => b - a)
                    .map(([owner, count]) => `
                        <div class="owner-stat">
                            <span class="owner-name">${owner}</span>
                            <span class="owner-count">${count} worksets</span>
                        </div>
                    `).join('')}
            </div>
        ` : ''}
    `;
};

DashboardApp.prototype.updateRevitVersionAnalysis = function() {
    const revitVersionAnalysisEl = document.getElementById('revitVersionAnalysis');
    if (!revitVersionAnalysisEl) return;

    // Aggregate Revit application version data (Autodesk Revit year versions)
    const versionData = {};
    const versionStats = {
        totalModels: 0,
        uniqueVersions: 0,
        versionBreakdown: {},
        latestVersion: null,
        oldestVersion: null
    };
    
    this.filteredData.forEach(item => {
        const version = item.revitVersion || 'Unknown';
        versionStats.totalModels++;
        
        if (!versionData[version]) {
            versionData[version] = {
                count: 0,
                models: [],
                totalElements: 0,
                totalViews: 0,
                totalWarnings: 0,
                avgExecutionTime: 0,
                executionTimes: []
            };
        }
        
        versionData[version].count++;
        versionData[version].models.push(item.modelName);
        versionData[version].totalElements += item.totalElements || 0;
        versionData[version].totalViews += item.totalViews || 0;
        versionData[version].totalWarnings += item.warningCount || 0;
        versionData[version].executionTimes.push(item.executionTime || 0);
    });
    
    // Calculate averages and find latest/oldest versions
    Object.keys(versionData).forEach(version => {
        const data = versionData[version];
        data.avgExecutionTime = data.executionTimes.reduce((sum, time) => sum + time, 0) / data.executionTimes.length;
        
        // Convert version to number for comparison (e.g., "2024" -> 2024)
        const versionNum = parseInt(version) || 0;
        if (versionNum > 0) {
            if (!versionStats.latestVersion || versionNum > parseInt(versionStats.latestVersion)) {
                versionStats.latestVersion = version;
            }
            if (!versionStats.oldestVersion || versionNum < parseInt(versionStats.oldestVersion)) {
                versionStats.oldestVersion = version;
            }
        }
    });
    
    versionStats.uniqueVersions = Object.keys(versionData).length;
    versionStats.versionBreakdown = versionData;
    
    // Display Revit application version analysis
    revitVersionAnalysisEl.innerHTML = `
        <div class="revit-version-stats">
            <div class="version-stat">
                <span class="stat-label">Total Models</span>
                <span class="stat-value">${versionStats.totalModels}</span>
            </div>
            <div class="version-stat">
                <span class="stat-label">Unique Application Versions</span>
                <span class="stat-value">${versionStats.uniqueVersions}</span>
            </div>
            <div class="version-stat">
                <span class="stat-label">Latest Application Version</span>
                <span class="stat-value">${versionStats.latestVersion || 'Unknown'}</span>
            </div>
            <div class="version-stat">
                <span class="stat-label">Oldest Application Version</span>
                <span class="stat-value">${versionStats.oldestVersion || 'Unknown'}</span>
            </div>
        </div>
        <div class="version-breakdown">
            <h5>Application Version Breakdown</h5>
            ${Object.entries(versionStats.versionBreakdown)
                .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort by version number descending
                .map(([version, data]) => `
                    <div class="version-detail">
                        <div class="version-header">
                            <span class="version-name">Revit ${version} Application</span>
                            <span class="version-count">${data.count} models</span>
                        </div>
                        <div class="version-metrics">
                            <div class="version-metric">
                                <span class="metric-label">Elements</span>
                                <span class="metric-value">${data.totalElements.toLocaleString()}</span>
                            </div>
                            <div class="version-metric">
                                <span class="metric-label">Views</span>
                                <span class="metric-value">${data.totalViews}</span>
                            </div>
                            <div class="version-metric">
                                <span class="metric-label">Warnings</span>
                                <span class="metric-value">${data.totalWarnings}</span>
                            </div>
                            <div class="version-metric">
                                <span class="metric-label">Avg Exec Time</span>
                                <span class="metric-value">${data.avgExecutionTime.toFixed(2)}s</span>
                            </div>
                        </div>
                        <div class="version-models">
                            <strong>Models:</strong> ${data.models.join(', ')}
                        </div>
                    </div>
                `).join('')}
        </div>
    `;
};

DashboardApp.prototype.updatePerformanceMetrics = function() {
    const performanceMetricsEl = document.getElementById('performanceMetrics');
    if (!performanceMetricsEl) return;
    
    // Calculate performance metrics
    const totalExecutionTime = this.filteredData.reduce((sum, item) => sum + (item.executionTime || 0), 0);
    const avgExecutionTime = totalExecutionTime / this.filteredData.length;
    const totalElements = this.filteredData.reduce((sum, item) => sum + (item.totalElements || 0), 0);
    const totalWarnings = this.filteredData.reduce((sum, item) => sum + (item.warningCount || 0), 0);
    const totalViews = this.filteredData.reduce((sum, item) => sum + (item.totalViews || 0), 0);
    
    performanceMetricsEl.innerHTML = `
        <div class="performance-stats">
            <div class="performance-stat">
                <span class="stat-label">Total Execution Time</span>
                <span class="stat-value">${totalExecutionTime.toFixed(2)}s</span>
            </div>
            <div class="performance-stat">
                <span class="stat-label">Average Execution Time</span>
                <span class="stat-value">${avgExecutionTime.toFixed(2)}s</span>
            </div>
            <div class="performance-stat">
                <span class="stat-label">Elements per Second</span>
                <span class="stat-value">${(totalElements / totalExecutionTime).toFixed(0)}</span>
            </div>
            <div class="performance-stat">
                <span class="stat-label">Warning Rate</span>
                <span class="stat-value">${((totalWarnings / totalElements) * 100).toFixed(2)}%</span>
            </div>
            <div class="performance-stat">
                <span class="stat-label">Views per Model</span>
                <span class="stat-value">${(totalViews / this.filteredData.length).toFixed(1)}</span>
            </div>
        </div>
    `;
};
