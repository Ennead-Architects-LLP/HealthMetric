// Additional Dashboard Methods
// This file contains the remaining methods for the DashboardApp class

// Tree Interactions
DashboardApp.prototype.setupTreeInteractions = function() {
    console.log('🌳 Setting up tree interactions...');
    
    // Tree toggle functionality
    document.querySelectorAll('.tree-toggle').forEach((toggle, index) => {
        console.log(`🌳 Setting up toggle ${index + 1}:`, toggle);
        
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔄 Toggle clicked:', toggle);
            
            const treeItem = toggle.closest('.tree-item');
            const children = treeItem.nextElementSibling;
            
            console.log('🌳 Tree item:', treeItem);
            console.log('🌳 Children element:', children);
            
            if (children && children.classList.contains('tree-children')) {
                const isCollapsed = children.classList.contains('collapsed');
                
                if (isCollapsed) {
                    // Expand
                    children.classList.remove('collapsed');
                    toggle.classList.remove('collapsed');
                    toggle.classList.add('expanded');
                    console.log('✅ Expanded children');
                } else {
                    // Collapse
                    children.classList.add('collapsed');
                    toggle.classList.remove('expanded');
                    toggle.classList.add('collapsed');
                    console.log('✅ Collapsed children');
                }
            } else {
                console.warn('⚠️ No children found for toggle');
            }
        });
    });
    
    console.log(`🌳 Set up ${document.querySelectorAll('.tree-toggle').length} tree toggles`);
    
    // Hub item clicks - show all data for that hub
    document.querySelectorAll('.hub-item').forEach(hubItem => {
        hubItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const hubName = hubItem.dataset.hub;
            this.filterByHub(hubName);
            this.highlightTreeItem(hubItem);
        });
    });
    
    // Project item clicks - filter by project
    document.querySelectorAll('.project-item').forEach(projectItem => {
        projectItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectName = projectItem.dataset.project;
            this.filterByProject(projectName);
            this.highlightTreeItem(projectItem);
        });
    });
    
    // Model item clicks - filter by model
    document.querySelectorAll('.model-item').forEach(modelItem => {
        modelItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const modelName = modelItem.dataset.model;
            this.filterByModel(modelName);
            this.highlightTreeItem(modelItem);
        });
    });
};

// Filter Methods
DashboardApp.prototype.filterByHub = function(hubName) {
    this.filteredData = this.data.filter(item => item.hubName === hubName);
    this.updateStats();
    this.renderTable();
    this.updateComparisonChart();
    this.updateComprehensiveData();
    this.updateFilterStatus(`Hub: ${hubName}`);
    console.log(`Filtered by hub: ${hubName}`);
};

DashboardApp.prototype.filterByProject = function(projectName) {
    this.filteredData = this.data.filter(item => item.projectName === projectName);
    this.updateStats();
    this.renderTable();
    this.updateComparisonChart();
    this.updateComprehensiveData();
    this.updateFilterStatus(`Project: ${projectName}`);
    console.log(`Filtered by project: ${projectName}`);
};

DashboardApp.prototype.filterByModel = function(modelName) {
    this.filteredData = this.data.filter(item => item.modelName === modelName);
    this.updateStats();
    this.renderTable();
    this.updateComparisonChart();
    this.updateComprehensiveData();
    this.updateFilterStatus(`Model: ${modelName}`);
    console.log(`Filtered by model: ${modelName}`);
};

DashboardApp.prototype.showAllData = function() {
    this.filteredData = [...this.data];
    this.updateStats();
    this.renderTable();
    this.updateComparisonChart();
    this.updateComprehensiveData();
    this.updateFilterStatus('All Data');
    console.log('Showing all data');
};

DashboardApp.prototype.updateFilterStatus = function(status) {
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        const filterLabel = filterStatus.querySelector('.filter-label');
        if (filterLabel) {
            filterLabel.textContent = `Showing: ${status}`;
        }
    }
};

DashboardApp.prototype.highlightTreeItem = function(selectedItem) {
    // Remove previous selection
    document.querySelectorAll('.tree-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    selectedItem.classList.add('selected');
};

// Search and Filter Methods
DashboardApp.prototype.handleSearch = function(query) {
    if (!query.trim()) {
        this.filteredData = [...this.data];
    } else {
        const searchType = document.getElementById('searchType').value;
        this.filteredData = this.data.filter(item => {
            const searchText = query.toLowerCase();
            switch (searchType) {
                case 'project':
                    return item.projectName.toLowerCase().includes(searchText);
                case 'hub':
                    return item.hubName.toLowerCase().includes(searchText);
                case 'model':
                    return item.modelName.toLowerCase().includes(searchText);
                default:
                    return item.projectName.toLowerCase().includes(searchText) ||
                           item.hubName.toLowerCase().includes(searchText) ||
                           item.modelName.toLowerCase().includes(searchText);
            }
        });
    }
    this.renderTable();
    this.updateCharts();
};

DashboardApp.prototype.handleDateFilter = function() {
    let filtered = [...this.data];
    
    // Date range filter
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (dateFrom && dateFrom.value) {
        filtered = filtered.filter(item => item.timestamp >= new Date(dateFrom.value));
    }
    
    if (dateTo && dateTo.value) {
        filtered = filtered.filter(item => item.timestamp <= new Date(dateTo.value));
    }
    
    this.filteredData = filtered;
    this.renderTable();
    this.updateCharts();
    this.updateComprehensiveData();
};

DashboardApp.prototype.setupCategoryFilters = function() {
    // Get all filter checkboxes
    const filterIds = [
        'showWarningsOnly', 'showCriticalWarnings',
        'showLargeModels', 'showSmallModels',
        'showRevit2024', 'showRevit2023', 'showRevit2025', 'showRevit2026'
    ];
    
    // Add event listeners to all filter checkboxes
    filterIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                this.applyCategoryFilters();
            });
        }
    });
};

DashboardApp.prototype.applyCategoryFilters = function() {
    let filtered = [...this.data];
    
    // Warnings filters
    const showWarningsOnly = document.getElementById('showWarningsOnly')?.checked;
    const showCriticalWarnings = document.getElementById('showCriticalWarnings')?.checked;
    
    if (showWarningsOnly !== undefined) {
        if (showWarningsOnly) {
            filtered = filtered.filter(item => (item.warningCount || 0) > 0);
        }
    }
    
    if (showCriticalWarnings !== undefined) {
        if (showCriticalWarnings) {
            filtered = filtered.filter(item => (item.criticalWarningCount || 0) > 0);
        }
    }
    
    // Model size filters
    const showLargeModels = document.getElementById('showLargeModels')?.checked;
    const showSmallModels = document.getElementById('showSmallModels')?.checked;
    
    if (showLargeModels !== undefined) {
        if (showLargeModels) {
            filtered = filtered.filter(item => (item.totalElements || 0) > 10000);
        }
    }
    
    if (showSmallModels !== undefined) {
        if (showSmallModels) {
            filtered = filtered.filter(item => (item.totalElements || 0) < 1000);
        }
    }
    
    // Revit application version filters (Autodesk Revit year versions like 2024, 2025, 2026)
    const showRevit2024 = document.getElementById('showRevit2024')?.checked;
    const showRevit2023 = document.getElementById('showRevit2023')?.checked;
    const showRevit2025 = document.getElementById('showRevit2025')?.checked;
    const showRevit2026 = document.getElementById('showRevit2026')?.checked;
    
    const versionFilters = [];
    if (showRevit2024) versionFilters.push('2024');
    if (showRevit2023) versionFilters.push('2023');
    if (showRevit2025) versionFilters.push('2025');
    if (showRevit2026) versionFilters.push('2026');
    
    if (versionFilters.length > 0) {
        filtered = filtered.filter(item => versionFilters.includes(item.revitVersion));
    }
    
    this.filteredData = filtered;
    this.updateStats();
    this.renderTable();
    this.updateComprehensiveData();
};
