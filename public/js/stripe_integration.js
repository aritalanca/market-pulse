/**
 * Stripe Integration Module
 * Handles Stripe payment processing for premium subscriptions
 */

window.StripeIntegration = (function() {
    // Stripe public key - would be replaced with actual key in production
    const stripePublicKey = 'pk_test_TYooMQauvdEDq54NiTphI7jx';
    let stripe = null;
    let elements = null;
    let card = null;
    
    // Initialize Stripe integration
    function initialize() {
        console.log('Stripe Integration module initialized');
        
        // Load Stripe.js
        loadStripeJs().then(() => {
            // Initialize Stripe with public key
            stripe = Stripe(stripePublicKey);
            
            // Create elements instance
            elements = stripe.elements();
            
            // Create card element
            createCardElement();
            
            // Set up event listeners
            setupEventListeners();
        });
    }
    
    // Load Stripe.js dynamically
    function loadStripeJs() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Create card element
    function createCardElement() {
        // Create card element
        card = elements.create('card', {
            style: {
                base: {
                    color: '#32325d',
                    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                    fontSmoothing: 'antialiased',
                    fontSize: '16px',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            }
        });
        
        // Mount card element
        card.mount('#card-element');
        
        // Handle real-time validation errors
        card.addEventListener('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Payment form submission
        const form = document.getElementById('payment-form');
        if (form) {
            form.addEventListener('submit', handlePaymentSubmission);
        }
        
        // Subscribe buttons
        document.querySelectorAll('.btn-subscribe').forEach(button => {
            button.addEventListener('click', showPaymentModal);
        });
    }
    
    // Show payment modal
    function showPaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            createPaymentModal();
        }
    }
    
    // Create payment modal if it doesn't exist
    function createPaymentModal() {
        const modal = document.createElement('div');
        modal.id = 'payment-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content payment-modal-content">
                <span class="modal-close">&times;</span>
                <h2>Subscribe to Market Pulse Premium</h2>
                <div class="payment-tabs">
                    <div class="payment-tab active" data-tab="card">Credit Card</div>
                    <div class="payment-tab" data-tab="paypal">PayPal</div>
                </div>
                <div class="payment-forms">
                    <form id="payment-form" class="payment-form">
                        <div class="form-group">
                            <label for="card-element">Credit or debit card</label>
                            <div id="card-element">
                                <!-- Stripe Card Element will be inserted here -->
                            </div>
                            <div id="card-errors" role="alert"></div>
                        </div>
                        <div class="form-group">
                            <label for="name">Name on card</label>
                            <input type="text" id="name" placeholder="Jane Doe" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email address</label>
                            <input type="email" id="email" placeholder="jane@example.com" required>
                        </div>
                        <button type="submit" id="submit-payment" class="btn-primary">Subscribe for $10/month</button>
                    </form>
                    <div id="paypal-form" class="payment-form" style="display: none;">
                        <p>Click the button below to pay with PayPal:</p>
                        <div id="paypal-button-container"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize card element
        createCardElement();
        
        // Set up event listeners for the new modal
        modal.querySelector('.modal-close').addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        document.querySelectorAll('.payment-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelector('.payment-tab.active').classList.remove('active');
                this.classList.add('active');
                
                const tabId = this.dataset.tab;
                document.querySelectorAll('.payment-form').forEach(function(form) {
                    form.style.display = 'none';
                });
                
                if (tabId === 'card') {
                    document.getElementById('payment-form').style.display = 'block';
                } else if (tabId === 'paypal') {
                    document.getElementById('paypal-form').style.display = 'block';
                }
            });
        });
        
        // Set up form submission
        document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmission);
        
        // Show the modal
        modal.style.display = 'flex';
    }
    
    // Handle payment form submission
    function handlePaymentSubmission(event) {
        event.preventDefault();
        
        const submitButton = document.getElementById('submit-payment');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        
        if (!nameInput.value || !emailInput.value) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Disable the submit button to prevent multiple submissions
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        // In a real implementation, this would create a payment intent on the server
        // and then confirm the payment with Stripe.js
        // For demo purposes, we'll simulate a successful payment
        
        setTimeout(() => {
            // Simulate successful payment
            handleSuccessfulPayment();
            
            // Reset the form
            submitButton.disabled = false;
            submitButton.textContent = 'Subscribe for $10/month';
            
            // Close the modal
            document.getElementById('payment-modal').style.display = 'none';
        }, 2000);
    }
    
    // Handle successful payment
    function handleSuccessfulPayment() {
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
        
        // In a real implementation, this would also:
        // 1. Create a user account if needed
        // 2. Store subscription information in the database
        // 3. Generate an invoice via InvoiceXpress
        // 4. Send a confirmation email
        
        // Trigger invoice generation
        generateInvoice();
    }
    
    // Generate invoice via InvoiceXpress
    function generateInvoice() {
        console.log('Generating invoice via InvoiceXpress...');
        
        // In a real implementation, this would call the server to generate an invoice
        // For demo purposes, we'll simulate a successful invoice generation
        
        setTimeout(() => {
            console.log('Invoice generated successfully');
        }, 1000);
    }
    
    // Public API
    return {
        initialize: initialize
    };
})();
