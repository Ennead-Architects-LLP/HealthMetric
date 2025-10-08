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
    this.loadScoreData(); // Update score data when filtering
    this.updateFilterStatus(`Hub: ${hubName}`);
    console.log(`Filtered by hub: ${hubName}`);
};

DashboardApp.prototype.filterByProject = function(projectName) {
    this.filteredData = this.data.filter(item => item.projectName === projectName);
    this.updateStats();
    this.renderTable();
    this.updateComparisonChart();
    this.updateComprehensiveData();
    this.loadScoreData(); // Update score data when filtering
    this.updateFilterStatus(`Project: ${projectName}`);
    console.log(`Filtered by project: ${projectName}`);
};

DashboardApp.prototype.filterByModel = function(modelName) {
    this.filteredData = this.data.filter(item => item.modelName === modelName);
    this.updateStats();
    this.renderTable();
    this.updateComparisonChart();
    this.updateComprehensiveData();
    this.loadScoreData(); // Update score data when filtering
    this.updateFilterStatus(`Model: ${modelName}`);
    console.log(`Filtered by model: ${modelName}`);
};

DashboardApp.prototype.showAllData = function() {
    this.filteredData = [...this.data];
    this.updateStats();
    this.renderTable();
    this.updateComparisonChart();
    this.updateComprehensiveData();
    this.loadScoreData(); // Update score data when showing all data
    this.updateFilterStatus('All Data');
    console.log('Showing all data');
};

DashboardApp.prototype.updateFilterStatus = function(status) {
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        const filterLabel = filterStatus.querySelector('.filter-label');
        if (filterLabel) {
            // If status already starts with "Showing:" or "Found", use it as-is
            // Otherwise, prepend "Showing: "
            if (status.startsWith('Showing:') || status.startsWith('Found')) {
                filterLabel.textContent = status;
            } else {
                filterLabel.textContent = `Showing: ${status}`;
            }
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
    console.log('🔍 Search triggered:', query);
    
    if (!query.trim()) {
        this.filteredData = [...this.data];
        this.updateFilterStatus('Showing: All Data');
    } else {
        const searchType = document.getElementById('searchType')?.value || 'all';
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
        
        // Update filter status
        const resultCount = this.filteredData.length;
        this.updateFilterStatus(`Found ${resultCount} result${resultCount !== 1 ? 's' : ''} for "${query}"`);
        console.log(`✅ Search complete: ${resultCount} results found`);
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

// Category filters are intentionally disabled for now. Placeholder to keep API stable.
DashboardApp.prototype.setupCategoryFilters = function() { /* no-op */ };
DashboardApp.prototype.applyCategoryFilters = function() { /* no-op */ };
