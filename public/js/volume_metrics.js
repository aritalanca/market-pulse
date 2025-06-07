/**
 * Volume Metrics Module
 * Handles the display and updating of volume metrics in stock cards
 */

window.VolumeMetrics = (function() {
    // Initialize volume metrics
    function initialize() {
        console.log('Volume Metrics module initialized');
        
        // Format volume numbers
        formatVolumeNumbers();
        
        // Highlight relative volume based on value
        highlightRelativeVolume();
    }
    
    // Format volume numbers to be more readable
    function formatVolumeNumbers() {
        document.querySelectorAll('.volume-value').forEach(element => {
            if (!element.classList.contains('rel-volume-very-high') && 
                !element.classList.contains('rel-volume-high') && 
                !element.classList.contains('rel-volume-normal') && 
                !element.classList.contains('rel-volume-low')) {
                
                const text = element.textContent;
                if (text.includes('M') || text.includes('K')) return; // Already formatted
                
                const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                if (isNaN(num)) return;
                
                if (num >= 1000000) {
                    element.textContent = (num / 1000000).toFixed(1) + 'M';
                } else if (num >= 1000) {
                    element.textContent = (num / 1000).toFixed(1) + 'K';
                }
            }
        });
    }
    
    // Highlight relative volume based on value
    function highlightRelativeVolume() {
        document.querySelectorAll('.rel-volume-value').forEach(element => {
            const text = element.textContent;
            const value = parseFloat(text.replace(/[^0-9.]/g, ''));
            
            if (isNaN(value)) return;
            
            if (value >= 4) {
                element.classList.add('rel-volume-very-high');
            } else if (value >= 2) {
                element.classList.add('rel-volume-high');
            } else if (value >= 1) {
                element.classList.add('rel-volume-normal');
            } else {
                element.classList.add('rel-volume-low');
            }
        });
    }
    
    // Public API
    return {
        initialize: initialize
    };
})();
