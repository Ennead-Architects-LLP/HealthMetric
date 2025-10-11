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
    
    // Aggregate data by project - use average for scores, total for other metrics
    const projectData = {};
    this.filteredData.forEach(item => {
        const key = item.projectName;
        if (!projectData[key]) {
            projectData[key] = {
                total: 0,
                count: 0
            };
        }
        
        // Handle score data specially (it's an object with total_score property)
        let value = 0;
        if (metric === 'totalScore') {
            value = item.score?.total_score || 0;
        } else {
            value = item[metric] || 0;
        }
        
        projectData[key].total += value;
        projectData[key].count++;
    });
    
    const labels = Object.keys(projectData);
    const isScoreMetric = metric === 'totalScore';
    
    // For score metric, use average. For others, use total
    const data = Object.values(projectData).map(p => 
        isScoreMetric ? (p.total / p.count) : p.total
    );
    
    const metricLabel = isScoreMetric ? 'Average Score per Project' : metric;
    
    this.charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: metricLabel,
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
