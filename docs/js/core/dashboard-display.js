// Dashboard Display Methods
// This file contains display and visualization methods for the DashboardApp class

// Stats and Table Methods
DashboardApp.prototype.updateStats = function() {
    const stats = {
        totalHubs: new Set(this.data.map(item => item.hubName)).size,
        totalProjects: new Set(this.data.map(item => item.projectName)).size,
        totalModels: new Set(this.data.map(item => item.modelName)).size,
        totalFiles: this.data.length
    };
    
    const totalHubsEl = document.getElementById('totalHubs');
    const totalProjectsEl = document.getElementById('totalProjects');
    const totalModelsEl = document.getElementById('totalModels');
    const totalFilesEl = document.getElementById('totalFiles');
    
    if (totalHubsEl) totalHubsEl.textContent = stats.totalHubs;
    if (totalProjectsEl) totalProjectsEl.textContent = stats.totalProjects;
    if (totalModelsEl) totalModelsEl.textContent = stats.totalModels;
    if (totalFilesEl) totalFilesEl.textContent = stats.totalFiles;
};

DashboardApp.prototype.renderTable = function() {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) {
        console.warn('⚠️ Data table body element not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    this.filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.hubName}</td>
            <td>${item.projectName}</td>
            <td>${item.modelName}</td>
            <td>${item.timestamp.toLocaleDateString()}</td>
            <td>${item.totalElements.toLocaleString()}</td>
            <td>${item.totalViews.toLocaleString()}</td>
            <td>${item.warningCount}</td>
            <td>${item.executionTime.toFixed(2)}s</td>
            <td>${item.revitVersion || 'Unknown'}</td>
        `;
        tbody.appendChild(row);
    });
};

DashboardApp.prototype.sortTable = function(column) {
    if (this.currentSort.column === column) {
        this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        this.currentSort.column = column;
        this.currentSort.direction = 'asc';
    }
    
    this.filteredData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (this.currentSort.direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    this.renderTable();
    this.updateSortIcons();
};

DashboardApp.prototype.updateSortIcons = function() {
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.textContent = '↕';
    });
    
    if (this.currentSort.column) {
        const header = document.querySelector(`[data-sort="${this.currentSort.column}"] .sort-icon`);
        if (header) {
            header.textContent = this.currentSort.direction === 'asc' ? '↑' : '↓';
        }
    }
};

// Chart Methods
DashboardApp.prototype.createCharts = function() {
    this.createComparisonChart();
};

DashboardApp.prototype.createComparisonChart = function() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    const metric = document.getElementById('comparisonMetric').value;
    
    // Aggregate data by project
    const projectData = {};
    this.filteredData.forEach(item => {
        const key = item.projectName;
        if (!projectData[key]) {
            projectData[key] = 0;
        }
        projectData[key] += item[metric];
    });
    
    const labels = Object.keys(projectData);
    const data = Object.values(projectData);
    
    this.charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: metric,
                data,
                backgroundColor: 'rgba(0, 255, 136, 0.6)',
                borderColor: 'rgba(0, 255, 136, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

DashboardApp.prototype.updateTimeSeriesChart = function() {
    if (this.charts.timeSeries) {
        this.charts.timeSeries.destroy();
    }
    this.createTimeSeriesChart();
};

DashboardApp.prototype.updateComparisonChart = function() {
    if (this.charts.comparison) {
        this.charts.comparison.destroy();
    }
    this.createComparisonChart();
};

DashboardApp.prototype.updateCharts = function() {
    this.updateTimeSeriesChart();
    this.updateComparisonChart();
};

// Export and Utility Methods
DashboardApp.prototype.exportToCSV = function() {
    const headers = ['Hub', 'Project', 'Model', 'Date', 'Elements', 'Views', 'Warnings', 'Execution Time', 'Revit Version', 'Format'];
    const csvContent = [
        headers.join(','),
        ...this.filteredData.map(item => [
            item.hubName,
            item.projectName,
            item.modelName,
            item.timestamp.toLocaleDateString(),
            item.totalElements,
            item.totalViews,
            item.warningCount,
            item.executionTime,
            item.revitVersion || 'Unknown',
            item.format || 'Unknown'
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'healthmetric_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
};

DashboardApp.prototype.showLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden');
};

DashboardApp.prototype.hideLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
    overlay.classList.add('hidden');
};

DashboardApp.prototype.showError = function(message) {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = message;
    loadingText.style.color = '#ff6b6b';
};

// Missing methods that are called by updateComprehensiveData
DashboardApp.prototype.updateModelStructure = function() {
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
    
    // Aggregate group usage data
    const groupData = {
        totalTypes: 0,
        overusedCount: 0,
        overusedGroups: []
    };
    
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
    
    // Aggregate templates and filters data
    const templatesData = {
        unusedViewTemplates: 0,
        filters: 0,
        unusedFilters: 0,
        viewTemplates: 0
    };
    
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

