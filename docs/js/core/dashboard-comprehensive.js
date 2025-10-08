// Dashboard Comprehensive Data Methods
// This file contains comprehensive data analysis methods for the DashboardApp class

// Comprehensive Data Display Functions
DashboardApp.prototype.updateComprehensiveData = function() {
    console.log('🔧 updateComprehensiveData called');
    console.log('🔧 typeof this.updateModelStructure:', typeof this.updateModelStructure);
    this.updateProjectTree();
    this.updateProjectOverview();
    this.updateWarningAnalysis();
    this.updateModelStructure();
    this.updateFamiliesAnalysis();
    this.updateGroupUsage();
    this.updateTemplatesFilters();
    this.updateCADFilesAnalysis();
    this.updateRoomsAnalysis();
    this.updateWorksetsAnalysis();
    this.updateRevitVersionAnalysis();
    // Performance metrics section temporarily removed from dashboard
};

DashboardApp.prototype.updateProjectTree = function() {
    const projectTreeEl = document.getElementById('projectTree');
    if (!projectTreeEl) {
        console.error('❌ Project tree element not found');
        return;
    }
    
    // Always build the tree from the full dataset so every item remains clickable
    const sourceData = Array.isArray(this.data) ? this.data : [];
    console.log('🌳 Updating project tree with', sourceData.length, 'items (full data)');
    
    // Group data by hub, then by project, then by model
    const treeData = {};
    
    sourceData.forEach(item => {
        const hubName = item.hubName || 'Unknown Hub';
        const projectName = item.projectName || 'Unknown Project';
        const modelName = item.modelName || 'Unknown Model';
        
        if (!treeData[hubName]) {
            treeData[hubName] = {};
        }
        if (!treeData[hubName][projectName]) {
            treeData[hubName][projectName] = [];
        }
        treeData[hubName][projectName].push(modelName);
    });
    
    // Generate HTML for the tree structure
    let treeHTML = '';
    
    Object.entries(treeData).forEach(([hubName, projects]) => {
        treeHTML += `
            <div class="tree-node">
                <div class="tree-item hub-item expandable" data-hub="${hubName}">
                    <button class="tree-toggle expanded"></button>
                    <span class="tree-icon"><img src="asset/icon/building.png" alt="Hub" class="icon icon-16 icon-invert"></span>
                    <span class="tree-label">${hubName}</span>
                </div>
                <div class="tree-children">
        `;
        
        Object.entries(projects).forEach(([projectName, models]) => {
            treeHTML += `
                <div class="tree-node">
                    <div class="tree-item project-item expandable" data-project="${projectName}">
                        <button class="tree-toggle expanded"></button>
                        <span class="tree-icon"><img src="asset/icon/data.png" alt="Project" class="icon icon-16 icon-invert"></span>
                        <span class="tree-label">${projectName}</span>
                    </div>
                    <div class="tree-children">
            `;
            
            models.forEach(modelName => {
                treeHTML += `
                    <div class="tree-node">
                        <div class="tree-item model-item" data-model="${modelName}">
                            <span class="tree-icon"><img src="asset/icon/tree-node.png" alt="Model" class="icon icon-16 icon-invert"></span>
                            <span class="tree-label">${modelName}</span>
                        </div>
                    </div>
                `;
            });
            
            treeHTML += `
                    </div>
                </div>
            `;
        });
        
        treeHTML += `
                </div>
            </div>
        `;
    });
    
    projectTreeEl.innerHTML = treeHTML;
    
    console.log('🌳 Project tree HTML generated:', treeHTML.length, 'characters');
    console.log('🌳 Tree data structure:', treeData);
    
    // Re-setup tree interactions after dynamic generation
    this.setupTreeInteractions();
};

DashboardApp.prototype.updateProjectOverview = function() {
    const projectOverviewEl = document.getElementById('projectOverview');
    if (!projectOverviewEl) return;
    
    // Get unique project information
    const uniqueProjects = [...new Set(this.filteredData.map(item => item.projectName))];
    const uniqueHubs = [...new Set(this.filteredData.map(item => item.hubName))];
    const totalModels = this.filteredData.length;
    const totalElements = this.filteredData.reduce((sum, item) => sum + (item.totalElements || 0), 0);
    const totalViews = this.filteredData.reduce((sum, item) => sum + (item.totalViews || 0), 0);
    const totalWarnings = this.filteredData.reduce((sum, item) => sum + (item.warningCount || 0), 0);
    
    projectOverviewEl.innerHTML = `
        <div class="project-stats">
            <div class="project-stat">
                <span class="stat-label">Hubs</span>
                <span class="count-badge">${uniqueHubs.length}</span>
            </div>
            <div class="project-stat">
                <span class="stat-label">Projects</span>
                <span class="count-badge">${uniqueProjects.length}</span>
            </div>
            <div class="project-stat">
                <span class="stat-label">Models</span>
                <span class="count-badge">${totalModels}</span>
            </div>
            <div class="project-stat">
                <span class="stat-label">Total Elements</span>
                <span class="count-badge">${totalElements.toLocaleString()}</span>
            </div>
            <div class="project-stat">
                <span class="stat-label">Total Views</span>
                <span class="count-badge">${totalViews}</span>
            </div>
            <div class="project-stat">
                <span class="stat-label">Total Warnings</span>
                <span class="count-badge count-badge--solid">${totalWarnings}</span>
            </div>
        </div>
    `;
};

DashboardApp.prototype.updateWarningAnalysis = function() {
    const warningCategoriesEl = document.getElementById('warningCategories');
    const warningUsersEl = document.getElementById('warningUsers');
    
    if (!warningCategoriesEl || !warningUsersEl) return;
    
    // Aggregate warning categories across all data
    const warningCategories = {};
    const warningUsers = {};
    
    // Calculate warning statistics from available data
    const totalWarnings = this.filteredData.reduce((sum, item) => sum + (item.warningCount || 0), 0);
    const criticalWarnings = this.filteredData.reduce((sum, item) => sum + (item.criticalWarningCount || 0), 0);
    const avgWarnings = this.filteredData.length > 0 ? (totalWarnings / this.filteredData.length).toFixed(1) : 0;
    
    // Group warnings by model
    this.filteredData.forEach(item => {
        const modelName = item.modelName;
        const warnings = item.warningCount || 0;
        if (!warningUsers[modelName]) {
            warningUsers[modelName] = warnings;
        }
    });
    
    // Display warning summary
    warningCategoriesEl.innerHTML = `
        <div class="warning-category">
            <span class="category-name">Total Warnings</span>
            <span class="category-count">${totalWarnings}</span>
        </div>
        <div class="warning-category">
            <span class="category-name">Critical Warnings</span>
            <span class="category-count">${criticalWarnings}</span>
        </div>
        <div class="warning-category">
            <span class="category-name">Average per Model</span>
            <span class="category-count">${avgWarnings}</span>
        </div>
    `;
    
    // Display warnings by model
    warningUsersEl.innerHTML = Object.entries(warningUsers)
        .sort(([,a], [,b]) => b - a)
        .map(([model, warnings]) => `
            <div class="warning-user">
                <div class="user-name">${model}</div>
                <div class="user-warnings">
                    <div class="user-warning">${warnings} warnings</div>
                </div>
            </div>
        `).join('');
};

