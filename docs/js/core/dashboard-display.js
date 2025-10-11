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

// Enhanced Chart Methods
DashboardApp.prototype.createCharts = function() {
    this.createComparisonChart();
    this.createTimeSeriesChart();
    this.createPieChart();
    this.createScatterPlot();
};

DashboardApp.prototype.createComparisonChart = function() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    const metric = document.getElementById('comparisonMetric').value;
    
    // Aggregate data by project with better formatting
    const projectData = {};
    this.filteredData.forEach(item => {
        const key = item.projectName;
        if (!projectData[key]) {
            projectData[key] = {
                total: 0,
                count: 0,
                models: []
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
        projectData[key].models.push(item.modelName);
    });
    
    const labels = Object.keys(projectData);
    const data = Object.values(projectData).map(p => p.total);
    const avgData = Object.values(projectData).map(p => p.total / p.count);
    
    // Get readable metric name
    const metricNames = {
        'totalScore': 'Score',
        'totalElements': 'Elements',
        'totalViews': 'Views',
        'warningCount': 'Warnings'
    };
    const metricLabel = metricNames[metric] || metric;
    
    // Destroy existing chart
    if (this.charts.comparison) {
        this.charts.comparison.destroy();
    }
    
    // For score metric, only show average (not total, as summing scores doesn't make sense)
    // For other metrics, show both total and average
    const isScoreMetric = metric === 'totalScore';
    
    const datasets = [];
    
    if (!isScoreMetric) {
        // Show total for non-score metrics
        datasets.push({
            label: `Total ${metricLabel}`,
            data,
            backgroundColor: 'rgba(37, 99, 235, 0.8)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
        });
    }
    
    // Always show average
    datasets.push({
        label: isScoreMetric ? `Average ${metricLabel} per Project` : `Average ${metricLabel}`,
        data: avgData,
        type: isScoreMetric ? 'bar' : 'line',
        backgroundColor: isScoreMetric ? 'rgba(37, 99, 235, 0.8)' : 'rgba(255, 107, 107, 0.2)',
        borderColor: isScoreMetric ? 'rgba(37, 99, 235, 1)' : 'rgba(255, 107, 107, 1)',
        borderWidth: isScoreMetric ? 2 : 3,
        borderRadius: isScoreMetric ? 4 : undefined,
        borderSkipped: isScoreMetric ? false : undefined,
        pointRadius: isScoreMetric ? undefined : 6,
        pointHoverRadius: isScoreMetric ? undefined : 8,
        tension: isScoreMetric ? undefined : 0.4
    });
    
    this.charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: `Project Comparison: ${metricLabel}`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return `Project: ${context[0].label}`;
                        },
                        label: function(context) {
                            const currentProjectData = Object.values(projectData)[context.dataIndex];
                            // For score metric, only show average. For others, show both total and average
                            if (isScoreMetric) {
                                return `Average Score: ${context.parsed.y.toFixed(2)}`;
                            } else {
                                if (context.datasetIndex === 0) {
                                    return `Total: ${context.parsed.y.toLocaleString()}`;
                                } else {
                                    return `Average: ${context.parsed.y.toLocaleString()}`;
                                }
                            }
                        },
                        afterLabel: function(context) {
                            const currentProjectData = Object.values(projectData)[context.dataIndex];
                            const modelsList = currentProjectData.models.map(model => `• ${model}`).join('\n');
                            return `Models (${currentProjectData.count}):\n${modelsList}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
};

DashboardApp.prototype.createTimeSeriesChart = function() {
    const ctx = document.getElementById('timeSeriesChart').getContext('2d');
    
    // Helper: get week start date (Monday) and format as yyyy-mm-dd
    // All data from Monday-Sunday will be grouped under that Monday's date
    // This matches the data file naming convention where weekly data files are prefixed with the Monday date
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (start week on Monday)
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0); // Reset time to midnight
        return weekStart;
    }
    
    function toWeekKey(date) {
        const weekStart = getWeekStart(date);
        const y = weekStart.getFullYear();
        const m = String(weekStart.getMonth() + 1).padStart(2, '0');
        const d = String(weekStart.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Group data by week and aggregate
    // All data from the same week (Mon-Sun) is aggregated under the Monday date
    const weeklyMap = new Map();
    for (const item of this.filteredData) {
        const key = toWeekKey(item.timestamp);
        if (!weeklyMap.has(key)) {
            weeklyMap.set(key, {
                totalElements: 0,
                totalWarnings: 0,
                executionTimeSum: 0,
                executionCount: 0
            });
        }
        const agg = weeklyMap.get(key);
        agg.totalElements += item.totalElements || 0;
        agg.totalWarnings += item.warningCount || 0;
        if (typeof item.executionTime === 'number') {
            agg.executionTimeSum += item.executionTime;
            agg.executionCount += 1;
        }
    }

    // Sort keys chronologically
    const labels = Array.from(weeklyMap.keys()).sort((a, b) => new Date(a) - new Date(b));
    const elementsData = labels.map(k => weeklyMap.get(k).totalElements);
    const warningsData = labels.map(k => weeklyMap.get(k).totalWarnings);
    const executionData = labels.map(k => {
        const agg = weeklyMap.get(k);
        return agg.executionCount > 0 ? agg.executionTimeSum / agg.executionCount : 0;
    });
    
    // Destroy existing chart
    if (this.charts.timeSeries) {
        this.charts.timeSeries.destroy();
    }
    
    this.charts.timeSeries = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Total Elements',
                data: elementsData,
                borderColor: 'rgba(37, 99, 235, 1)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'Warnings',
                data: warningsData,
                borderColor: 'rgba(255, 107, 107, 1)',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.4,
                yAxisID: 'y1'
            }, {
                label: 'Execution Time (s)',
                data: executionData,
                borderColor: 'rgba(78, 205, 196, 1)',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.4,
                yAxisID: 'y2'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Performance Trends by Week (Week Starting)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return `Week of ${context[0].label}`;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            if (context.datasetIndex === 0) {
                                return `Elements (sum): ${Number(value).toLocaleString()}`;
                            } else if (context.datasetIndex === 1) {
                                return `Warnings (sum): ${Number(value).toLocaleString()}`;
                            } else {
                                return `Execution Time (avg): ${Number(value).toFixed(2)}s`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 20
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Elements'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Warnings'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                y2: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
};

DashboardApp.prototype.createPieChart = function() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    // Aggregate data by Revit version
    const versionData = {};
    this.filteredData.forEach(item => {
        const version = item.revitVersion || 'Unknown';
        if (!versionData[version]) {
            versionData[version] = {
                count: 0,
                totalElements: 0,
                totalWarnings: 0
            };
        }
        versionData[version].count++;
        versionData[version].totalElements += item.totalElements || 0;
        versionData[version].totalWarnings += item.warningCount || 0;
    });
    
    const labels = Object.keys(versionData);
    const data = Object.values(versionData).map(v => v.count);
    const colors = [
        'rgba(37, 99, 235, 0.8)',
        'rgba(255, 107, 107, 0.8)',
        'rgba(78, 205, 196, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(108, 117, 125, 0.8)',
        'rgba(220, 53, 69, 0.8)',
        'rgba(40, 167, 69, 0.8)',
        'rgba(253, 126, 20, 0.8)'
    ];
    
    // Destroy existing chart
    if (this.charts.pie) {
        this.charts.pie.destroy();
    }
    
    this.charts.pie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: colors.slice(0, labels.length).map(color => color.replace('0.8', '1')),
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Models by Revit Version',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const dataset = data.datasets[0];
                                    const value = dataset.data[i];
                                    const total = dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: dataset.backgroundColor[i],
                                        strokeStyle: dataset.borderColor[i],
                                        lineWidth: dataset.borderWidth,
                                        pointStyle: 'circle'
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const version = context.label;
                            const versionData = Object.values(versionData)[context.dataIndex];
                            return [
                                `Models: ${context.parsed}`,
                                `Total Elements: ${versionData.totalElements.toLocaleString()}`,
                                `Total Warnings: ${versionData.totalWarnings}`
                            ];
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
};

DashboardApp.prototype.createScatterPlot = function() {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    
    // Prepare scatter plot data
    const scatterData = this.filteredData.map(item => ({
        x: item.totalElements,
        y: item.warningCount,
        label: `${item.projectName} - ${item.modelName}`,
        executionTime: item.executionTime,
        revitVersion: item.revitVersion
    }));
    
    // Destroy existing chart
    if (this.charts.scatter) {
        this.charts.scatter.destroy();
    }
    
    this.charts.scatter = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Elements vs Warnings',
                data: scatterData,
                backgroundColor: scatterData.map(item => {
                    // Color by Revit version
                    const version = item.revitVersion;
                    if (version === '2024') return 'rgba(37, 99, 235, 0.6)';
                    if (version === '2023') return 'rgba(255, 107, 107, 0.6)';
                    if (version === '2022') return 'rgba(78, 205, 196, 0.6)';
                    return 'rgba(108, 117, 125, 0.6)';
                }),
                borderColor: scatterData.map(item => {
                    const version = item.revitVersion;
                    if (version === '2024') return 'rgba(37, 99, 235, 1)';
                    if (version === '2023') return 'rgba(255, 107, 107, 1)';
                    if (version === '2022') return 'rgba(78, 205, 196, 1)';
                    return 'rgba(108, 117, 125, 1)';
                }),
                borderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Elements vs Warnings Correlation',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return context[0].raw.label;
                        },
                        label: function(context) {
                            const data = context.raw;
                            return [
                                `Elements: ${data.x.toLocaleString()}`,
                                `Warnings: ${data.y}`,
                                `Execution Time: ${data.executionTime.toFixed(2)}s`,
                                `Revit Version: ${data.revitVersion || 'Unknown'}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Total Elements'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Warning Count'
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
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
