/**
 * HealthMetric Dashboard - Data Upload Utility
 * Allows users to upload and test new data formats
 */

class DataUploader {
    constructor() {
        this.supportedTypes = ['application/json', 'text/plain'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.dataLoader = null;
    }
    
    /**
     * Initialize the uploader
     * @param {DataLoader} dataLoader - Data loader instance
     */
    init(dataLoader) {
        this.dataLoader = dataLoader;
        this.createUploadInterface();
    }
    
    /**
     * Create upload interface
     */
    createUploadInterface() {
        // Create upload button
        const uploadBtn = document.createElement('button');
        uploadBtn.id = 'dataUploadBtn';
        uploadBtn.className = 'btn btn-secondary';
        uploadBtn.innerHTML = '<img src="../../asset/icon/upload.png" alt="Upload" class="icon icon-16 icon-with-text icon-invert">Upload Data File';
        uploadBtn.style.margin = '10px';
        
        // Create file input (hidden)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.sexyDuck,.txt';
        fileInput.style.display = 'none';
        fileInput.id = 'dataFileInput';
        
        // Add event listeners
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
        
        // Add to dashboard
        const dashboardHeader = document.querySelector('.dashboard-header');
        if (dashboardHeader) {
            dashboardHeader.appendChild(uploadBtn);
            dashboardHeader.appendChild(fileInput);
        }
    }
    
    /**
     * Handle file upload
     * @param {File} file - Uploaded file
     */
    async handleFileUpload(file) {
        if (!file) return;
        
        try {
            // Validate file
            if (!this.validateFile(file)) {
                return;
            }
            
            console.log(`Uploading file: ${file.name}`);
            
            // Read file content
            const content = await this.readFileContent(file);
            
            // Parse JSON
            const data = JSON.parse(content);
            
            // Test with data loader
            const testResult = await this.testDataFile(data, file.name);
            
            if (testResult.success) {
                this.showSuccess(`File "${file.name}" uploaded and parsed successfully!`);
                console.log('Parsed data:', testResult.data);
            } else {
                this.showError(`Failed to parse file "${file.name}": ${testResult.error}`);
            }
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showError(`Error uploading file: ${error.message}`);
        }
    }
    
    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     * @returns {boolean} True if valid
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showError(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
            return false;
        }
        
        // Check file type
        if (!this.supportedTypes.includes(file.type) && !file.name.endsWith('.sexyDuck')) {
            this.showError('Unsupported file type. Please upload JSON or SexyDuck files.');
            return false;
        }
        
        return true;
    }
    
    /**
     * Read file content
     * @param {File} file - File to read
     * @returns {Promise<string>} File content
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Test data file with data loader
     * @param {Object} data - Parsed data
     * @param {string} filename - Filename
     * @returns {Promise<Object>} Test result
     */
    async testDataFile(data, filename) {
        try {
            if (!this.dataLoader) {
                throw new Error('Data loader not initialized');
            }
            
            // Test parsing
            const parsed = this.dataLoader.pluginManager.parseData(data, filename);
            
            if (parsed) {
                return {
                    success: true,
                    data: parsed,
                    message: 'File parsed successfully'
                };
            } else {
                return {
                    success: false,
                    error: 'No plugin could parse this file format',
                    data: null
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    /**
     * Show message to user
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `upload-message upload-message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                messageEl.style.backgroundColor = '#4ecdc4';
                break;
            case 'error':
                messageEl.style.backgroundColor = '#ff6b6b';
                break;
            default:
                messageEl.style.backgroundColor = '#2563eb';
        }
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataUploader;
}
