/**
 * PayPal Integration Module
 * Handles PayPal payment processing for premium subscriptions
 */

window.PayPalIntegration = (function() {
    // Initialize PayPal integration
    function initialize() {
        console.log('PayPal Integration module initialized');
        
        // Load PayPal JS SDK
        loadPayPalJs().then(() => {
            // Initialize PayPal buttons
            initializePayPalButtons();
            
            // Set up event listeners
            setupEventListeners();
        });
    }
    
    // Load PayPal JS SDK dynamically
    function loadPayPalJs() {
        return new Promise((resolve, reject) => {
            if (window.paypal) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://www.paypal.com/sdk/js?client-id=test&currency=USD';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Initialize PayPal buttons
    function initializePayPalButtons() {
        if (!window.paypal || !document.getElementById('paypal-button-container')) {
            // If PayPal SDK or container not available, try again later
            setTimeout(initializePayPalButtons, 500);
            return;
        }
        
        window.paypal.Buttons({
            // Set up the transaction
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '10.00'
                        },
                        description: 'Market Pulse Premium Subscription - Monthly'
                    }]
                });
            },
            
            // Finalize the transaction
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    // Show a success message
                    handleSuccessfulPayment(details);
                });
            },
            
            // Handle errors
            onError: function(err) {
                console.error('PayPal error:', err);
                alert('There was an error processing your payment. Please try again.');
            }
        }).render('#paypal-button-container');
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Payment tabs
        document.querySelectorAll('.payment-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                if (this.dataset.tab === 'paypal') {
                    // Ensure PayPal buttons are initialized when tab is selected
                    initializePayPalButtons();
                }
            });
        });
    }
    
    // Handle successful payment
    function handleSuccessfulPayment(details) {
        console.log('PayPal transaction completed by ' + details.payer.name.given_name);
        
        // Remove paywalls
        document.querySelectorAll('.paywall').forEach(paywall => {
            paywall.style.display = 'none';
        });
        
        // Update UI to show premium status
        document.querySelectorAll('.premium-card').forEach(card => {
            card.classList.remove('premium-card');
        });
        
        // Show success message
        alert('Thank you for subscribing to Market Pulse Premium! You now have access to all premium features.');
        
        // Close the modal
        document.getElementById('payment-modal').style.display = 'none';
        
        // In a real implementation, this would also:
        // 1. Create a user account if needed
        // 2. Store subscription information in the database
        // 3. Generate an invoice via InvoiceXpress
        // 4. Send a confirmation email
        
        // Trigger invoice generation
        generateInvoice(details);
    }
    
    // Generate invoice via InvoiceXpress
    function generateInvoice(details) {
        console.log('Generating invoice via InvoiceXpress...');
        
        // In a real implementation, this would call the server to generate an invoice
        // For demo purposes, we'll simulate a successful invoice generation
        
        setTimeout(() => {
            console.log('Invoice generated successfully for PayPal payment');
        }, 1000);
    }
    
    // Public API
    return {
        initialize: initialize
    };
})();
