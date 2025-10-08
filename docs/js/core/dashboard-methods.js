// Additional Dashboard Methods
// This file contains the remaining methods for the DashboardApp class

// Tree Interactions
DashboardApp.prototype.setupTreeInteractions = function() {
    console.log('🌳 Setting up enhanced tree interactions...');
    
    // Setup Expand All / Collapse All buttons
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');
    
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => this.expandAllTreeNodes());
    }
    
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => this.collapseAllTreeNodes());
    }
    
    // Enhanced tree toggle functionality
    document.querySelectorAll('.tree-toggle').forEach((toggle, index) => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const treeItem = toggle.closest('.tree-item');
            this.toggleTreeNode(treeItem);
        });
    });
    
    // Make entire expandable tree item clickable for toggle
    document.querySelectorAll('.tree-item.expandable').forEach(item => {
        // Click on tree item (but not on toggle) to expand/collapse
        item.addEventListener('click', (e) => {
            // If click is on toggle button, let toggle handler deal with it
            if (e.target.closest('.tree-toggle')) {
                return;
            }
            
            // Toggle the node
            this.toggleTreeNode(item);
            
            // Also handle filtering
            const hubName = item.dataset.hub;
            const projectName = item.dataset.project;
            
            if (hubName && item.classList.contains('hub-item')) {
                this.filterByHub(hubName);
                this.highlightTreeItem(item);
            } else if (projectName && item.classList.contains('project-item')) {
                this.filterByProject(projectName);
                this.highlightTreeItem(item);
            }
        });
        
        // Keyboard navigation
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', (e) => {
            this.handleTreeKeyNavigation(e, item);
        });
    });
    
    // Model item clicks - filter by model (models are not expandable)
    document.querySelectorAll('.model-item').forEach(modelItem => {
        modelItem.setAttribute('tabindex', '0');
        modelItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const modelName = modelItem.dataset.model;
            this.filterByModel(modelName);
            this.highlightTreeItem(modelItem);
        });
        
        modelItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const modelName = modelItem.dataset.model;
                this.filterByModel(modelName);
                this.highlightTreeItem(modelItem);
            }
        });
    });
    
    // Load saved tree state from localStorage
    this.loadTreeState();
    
    console.log(`🌳 Enhanced tree setup complete with ${document.querySelectorAll('.tree-toggle').length} toggles`);
};

// Toggle individual tree node
DashboardApp.prototype.toggleTreeNode = function(treeItem) {
    if (!treeItem) return;
    
    const toggle = treeItem.querySelector('.tree-toggle');
    const children = treeItem.nextElementSibling;
    
    if (children && children.classList.contains('tree-children')) {
        const isCollapsed = children.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            children.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            toggle.classList.add('expanded');
        } else {
            // Collapse
            children.classList.add('collapsed');
            toggle.classList.remove('expanded');
            toggle.classList.add('collapsed');
        }
        
        // Save state to localStorage
        this.saveTreeState();
    }
};

// Expand all tree nodes
DashboardApp.prototype.expandAllTreeNodes = function() {
    console.log('🌳 Expanding all tree nodes...');
    document.querySelectorAll('.tree-children').forEach(children => {
        children.classList.remove('collapsed');
    });
    document.querySelectorAll('.tree-toggle').forEach(toggle => {
        toggle.classList.remove('collapsed');
        toggle.classList.add('expanded');
    });
    this.saveTreeState();
};

// Collapse all tree nodes
DashboardApp.prototype.collapseAllTreeNodes = function() {
    console.log('🌳 Collapsing all tree nodes...');
    document.querySelectorAll('.tree-children').forEach(children => {
        children.classList.add('collapsed');
    });
    document.querySelectorAll('.tree-toggle').forEach(toggle => {
        toggle.classList.remove('expanded');
        toggle.classList.add('collapsed');
    });
    this.saveTreeState();
};

// Save tree state to localStorage
DashboardApp.prototype.saveTreeState = function() {
    try {
        const state = [];
        document.querySelectorAll('.tree-item.expandable').forEach((item, index) => {
            const children = item.nextElementSibling;
            if (children && children.classList.contains('tree-children')) {
                const isExpanded = !children.classList.contains('collapsed');
                state.push({
                    index: index,
                    expanded: isExpanded,
                    hub: item.dataset.hub,
                    project: item.dataset.project
                });
            }
        });
        localStorage.setItem('healthmetric_tree_state', JSON.stringify(state));
    } catch (error) {
        console.warn('Failed to save tree state:', error);
    }
};

// Load tree state from localStorage
DashboardApp.prototype.loadTreeState = function() {
    try {
        const savedState = localStorage.getItem('healthmetric_tree_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            document.querySelectorAll('.tree-item.expandable').forEach((item, index) => {
                const itemState = state.find(s => s.index === index);
                if (itemState) {
                    const children = item.nextElementSibling;
                    const toggle = item.querySelector('.tree-toggle');
                    
                    if (children && toggle) {
                        if (itemState.expanded) {
                            children.classList.remove('collapsed');
                            toggle.classList.remove('collapsed');
                            toggle.classList.add('expanded');
                        } else {
                            children.classList.add('collapsed');
                            toggle.classList.remove('expanded');
                            toggle.classList.add('collapsed');
                        }
                    }
                }
            });
            console.log('✅ Tree state loaded from localStorage');
        } else {
            // Set smart initial state: hubs expanded, projects collapsed
            this.setSmartInitialTreeState();
        }
    } catch (error) {
        console.warn('Failed to load tree state:', error);
        this.setSmartInitialTreeState();
    }
};

// Set smart initial tree state
DashboardApp.prototype.setSmartInitialTreeState = function() {
    console.log('🌳 Setting smart initial tree state...');
    
    // Expand hubs, collapse projects
    document.querySelectorAll('.tree-item.hub-item').forEach(hubItem => {
        const children = hubItem.nextElementSibling;
        const toggle = hubItem.querySelector('.tree-toggle');
        
        if (children && toggle) {
            children.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            toggle.classList.add('expanded');
        }
    });
    
    document.querySelectorAll('.tree-item.project-item').forEach(projectItem => {
        const children = projectItem.nextElementSibling;
        const toggle = projectItem.querySelector('.tree-toggle');
        
        if (children && toggle) {
            children.classList.add('collapsed');
            toggle.classList.remove('expanded');
            toggle.classList.add('collapsed');
        }
    });
    
    this.saveTreeState();
};

// Keyboard navigation for tree
DashboardApp.prototype.handleTreeKeyNavigation = function(e, item) {
    switch(e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            this.toggleTreeNode(item);
            break;
        case 'ArrowRight':
            e.preventDefault();
            // Expand if collapsed
            const childrenRight = item.nextElementSibling;
            if (childrenRight && childrenRight.classList.contains('collapsed')) {
                this.toggleTreeNode(item);
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            // Collapse if expanded
            const childrenLeft = item.nextElementSibling;
            if (childrenLeft && !childrenLeft.classList.contains('collapsed')) {
                this.toggleTreeNode(item);
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            // Focus next focusable tree item
            this.focusNextTreeItem(item);
            break;
        case 'ArrowUp':
            e.preventDefault();
            // Focus previous focusable tree item
            this.focusPreviousTreeItem(item);
            break;
    }
};

// Focus next tree item
DashboardApp.prototype.focusNextTreeItem = function(currentItem) {
    const allItems = Array.from(document.querySelectorAll('.tree-item[tabindex="0"]'));
    const currentIndex = allItems.indexOf(currentItem);
    if (currentIndex < allItems.length - 1) {
        allItems[currentIndex + 1].focus();
    }
};

// Focus previous tree item
DashboardApp.prototype.focusPreviousTreeItem = function(currentItem) {
    const allItems = Array.from(document.querySelectorAll('.tree-item[tabindex="0"]'));
    const currentIndex = allItems.indexOf(currentItem);
    if (currentIndex > 0) {
        allItems[currentIndex - 1].focus();
    }
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
