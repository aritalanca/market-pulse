/**
 * Real-time Updates Module
 * Handles live data updates and notifications for stock information
 */

window.RealtimeUpdates = (function() {
    // Configuration
    const config = {
        updateInterval: 30000, // 30 seconds by default
        lastUpdateTimestamp: 0,
        isUpdating: false,
        stockDataEndpoint: '/api/stocks/realtime', // Would be replaced with actual endpoint
        updateCountdownElement: null,
        countdownInterval: null
    };
    
    // Initialize real-time updates
    function initialize() {
        console.log('Real-time Updates module initialized');
        
        // Set up the update countdown display
        setupUpdateCountdown();
        
        // Set up event listeners
        setupEventListeners();
        
        // Start the update cycle
        startUpdateCycle();
    }
    
    // Set up the update countdown display
    function setupUpdateCountdown() {
        // Countdown disabled - no timer display
        console.log('Update countdown disabled');
    }{
        // Force update button
        const forceUpdateButton = document.getElementById('force-update');
        if (forceUpdateButton) {
            forceUpdateButton.addEventListener('click', forceUpdate);
        }
        
        // Update interval selector (if exists)
        const updateIntervalSelector = document.getElementById('update-interval');
        if (updateIntervalSelector) {
            updateIntervalSelector.addEventListener('change', function() {
                config.updateInterval = parseInt(this.value) * 1000;
                resetCountdown();
            });
        }
    }
    
    // Start the update cycle
    function startUpdateCycle() {
        // Set initial timestamp
        config.lastUpdateTimestamp = Date.now();
        
        // Start countdown
        startCountdown();
        
        // Schedule first update
        setTimeout(updateStockData, config.updateInterval);
    }
    
    // Start countdown timer
    function startCountdown() {
        // Clear any existing interval
        if (config.countdownInterval) {
            clearInterval(config.countdownInterval);
        }
        
        // Calculate initial seconds remaining
        const secondsRemaining = Math.ceil((config.lastUpdateTimestamp + config.updateInterval - Date.now()) / 1000);
        
        // Update countdown display
        if (config.updateCountdownElement) {
            config.updateCountdownElement.textContent = secondsRemaining;
        }
        
        // Start interval to update countdown every second
        config.countdownInterval = setInterval(() => {
            const secondsRemaining = Math.ceil((config.lastUpdateTimestamp + config.updateInterval - Date.now()) / 1000);
            
            if (secondsRemaining <= 0) {
                // Clear interval when countdown reaches zero
                clearInterval(config.countdownInterval);
                config.countdownInterval = null;
                
                // Update countdown display
                if (config.updateCountdownElement) {
                    config.updateCountdownElement.textContent = '0';
                }
            } else {
                // Update countdown display
                if (config.updateCountdownElement) {
                    config.updateCountdownElement.textContent = secondsRemaining;
                }
            }
        }, 1000);
    }
    
    // Reset countdown timer
    function resetCountdown() {
        // Update timestamp
        config.lastUpdateTimestamp = Date.now();
        
        // Restart countdown
        startCountdown();
    }
    
    // Force an immediate update
    function forceUpdate() {
        // Prevent multiple simultaneous updates
        if (config.isUpdating) {
            return;
        }
        
        // Update stock data
        updateStockData();
        
        // Reset countdown
        resetCountdown();
    }
    
    // Update stock data
    function updateStockData() {
        // Set updating flag
        config.isUpdating = true;
        
        // Show loading indicator
        const forceUpdateButton = document.getElementById('force-update');
        if (forceUpdateButton) {
            forceUpdateButton.textContent = 'Updating...';
            forceUpdateButton.disabled = true;
        }
        
        // In a real implementation, this would fetch data from the API
        // For demo purposes, we'll simulate an API call
        console.log('Fetching real-time stock data...');
        
        setTimeout(() => {
            // Simulate data update
            simulateDataUpdate();
            
            // Update timestamp
            config.lastUpdateTimestamp = Date.now();
            
            // Reset updating flag
            config.isUpdating = false;
            
            // Reset button
            if (forceUpdateButton) {
                forceUpdateButton.textContent = 'Update Now';
                forceUpdateButton.disabled = false;
            }
            
            // Restart countdown
            startCountdown();
            
            // Schedule next update
            setTimeout(updateStockData, config.updateInterval);
        }, 1500);
    }
    
    // Simulate data update
    function simulateDataUpdate() {
        // Get all stock cards
        const stockCards = document.querySelectorAll('.stock-card');
        
        // Update each card with slightly different data
        stockCards.forEach(card => {
            // Update price
            const priceElement = card.querySelector('.stock-price h3');
            if (priceElement) {
                const currentPrice = parseFloat(priceElement.textContent.replace('$', ''));
                const change = (Math.random() * 2 - 1) * (currentPrice * 0.02); // Random change up to ±2%
                const newPrice = (currentPrice + change).toFixed(2);
                priceElement.textContent = '$' + newPrice;
                
                // Update price change
                const priceChangeElement = card.querySelector('.price-change');
                if (priceChangeElement) {
                    const changeValue = change.toFixed(2);
                    const changePercent = ((change / currentPrice) * 100).toFixed(1);
                    const changeText = `${changeValue > 0 ? '+' : ''}${changeValue} (${changeValue > 0 ? '+' : ''}${changePercent}%)`;
                    
                    priceChangeElement.textContent = changeText;
                    
                    // Update class based on change direction
                    priceChangeElement.classList.remove('positive', 'negative');
                    priceChangeElement.classList.add(change >= 0 ? 'positive' : 'negative');
                }
            }
            
            // Update volume
            const volumeElement = card.querySelector('.volume .value');
            if (volumeElement) {
                const currentVolume = parseVolumeString(volumeElement.textContent);
                const volumeChange = currentVolume * (Math.random() * 0.1 + 0.95); // Random change between -5% and +5%
                volumeElement.textContent = formatVolume(volumeChange);
            }
            
            // Update relative volume
            const relVolumeElement = card.querySelector('.rel-volume .value');
            if (relVolumeElement) {
                const currentRelVolume = parseFloat(relVolumeElement.textContent);
                const relVolumeChange = currentRelVolume * (Math.random() * 0.2 + 0.9); // Random change between -10% and +10%
                relVolumeElement.textContent = relVolumeChange.toFixed(1);
            }
        });
        
        // Show notification
        showUpdateNotification();
    }
    
    // Parse volume string (e.g., "44.3M" -> 44300000)
    function parseVolumeString(volumeStr) {
        const value = parseFloat(volumeStr.replace(/[^0-9.]/g, ''));
        const multiplier = volumeStr.includes('M') ? 1000000 : (volumeStr.includes('K') ? 1000 : 1);
        return value * multiplier;
    }
    
    // Format volume number (e.g., 44300000 -> "44.3M")
    function formatVolume(volume) {
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(1) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        } else {
            return volume.toFixed(0);
        }
    }
    
    // Show update notification
    function showUpdateNotification() {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.textContent = 'Data updated successfully!';
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after animation
        setTimeout(() => {
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
                
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 3000);
        }, 10);
    }
    
    // Public API
    return {
        initialize: initialize,
        forceUpdate: forceUpdate
    };
})();
