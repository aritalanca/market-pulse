/**
 * Filter Manager Module
 * Handles custom filters for price range and volume thresholds
 */

window.FilterManager = (function() {
    // Initialize filter manager
    function initialize() {
        console.log('Filter Manager module initialized');
        
        // Set up event listeners for filters
        setupEventListeners();
        
        // Load saved preferences if available
        loadSavedPreferences();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Apply filters button
        document.getElementById('apply-filters').addEventListener('click', function() {
            applyFilters();
        });
        
        // Reset filters button
        document.getElementById('reset-filters').addEventListener('click', function() {
            resetFilters();
        });
    }
    
    // Apply filters to stocks
    function applyFilters() {
        const minPrice = parseFloat(document.getElementById('price-min').value) || 0;
        const maxPrice = parseFloat(document.getElementById('price-max').value) || 100;
        const minVolume = parseInt(document.getElementById('volume-min').value) || 0;
        
        // Save preferences
        savePreferences(minPrice, maxPrice, minVolume);
        
        // In a real implementation, this would filter the stocks based on the criteria
        // For demo purposes, just show a message
        alert(`Filters applied: Price $${minPrice} - $${maxPrice}, Min Volume: ${minVolume.toLocaleString()}`);
    }
    
    // Reset filters to default values
    function resetFilters() {
        document.getElementById('price-min').value = '2';
        document.getElementById('price-max').value = '10';
        document.getElementById('volume-min').value = '2000000';
        
        // Clear saved preferences
        localStorage.removeItem('premarket_filters');
        
        // Apply the reset filters
        applyFilters();
    }
    
    // Save filter preferences to localStorage
    function savePreferences(minPrice, maxPrice, minVolume) {
        const preferences = {
            minPrice: minPrice,
            maxPrice: maxPrice,
            minVolume: minVolume,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('premarket_filters', JSON.stringify(preferences));
    }
    
    // Load saved preferences from localStorage
    function loadSavedPreferences() {
        const savedPreferences = localStorage.getItem('premarket_filters');
        
        if (savedPreferences) {
            try {
                const preferences = JSON.parse(savedPreferences);
                
                document.getElementById('price-min').value = preferences.minPrice;
                document.getElementById('price-max').value = preferences.maxPrice;
                document.getElementById('volume-min').value = preferences.minVolume;
                
                console.log('Loaded saved filter preferences');
            } catch (e) {
                console.error('Error loading saved preferences:', e);
            }
        }
    }
    
    // Public API
    return {
        initialize: initialize
    };
})();
