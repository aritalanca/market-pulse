/**
 * Onboarding and Monetization Module
 * Handles user onboarding, login, and subscription management
 */

window.OnboardingMonetization = (function() {
    // Initialize onboarding and monetization functionality
    function initialize() {
        console.log('Onboarding & Monetization module initialized');
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Login button - check if exists
        const loginButton = document.querySelector('.login-button');
        if (loginButton) {
            loginButton.addEventListener('click', function() {
                const authModal = document.getElementById('auth-modal');
                if (authModal) {
                    authModal.style.display = 'flex';
                }
            });
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(function(button) {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Switch between login and signup
        const showSignup = document.getElementById('show-signup');
        if (showSignup) {
            showSignup.addEventListener('click', function(e) {
                e.preventDefault();
                const loginForm = document.getElementById('login-form');
                const signupForm = document.getElementById('signup-form');
                const modalTitle = document.getElementById('modal-title');
                
                if (loginForm) loginForm.style.display = 'none';
                if (signupForm) signupForm.style.display = 'block';
                if (modalTitle) modalTitle.textContent = 'Sign Up';
            });
        }
        
        const showLogin = document.getElementById('show-login');
        if (showLogin) {
            showLogin.addEventListener('click', function(e) {
                e.preventDefault();
                const loginForm = document.getElementById('login-form');
                const signupForm = document.getElementById('signup-form');
                const modalTitle = document.getElementById('modal-title');
                
                if (signupForm) signupForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (modalTitle) modalTitle.textContent = 'Login';
            });
        }
        
        // Payment tabs
        document.querySelectorAll('.payment-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                const activeTab = document.querySelector('.payment-tab.active');
                if (activeTab) {
                    activeTab.classList.remove('active');
                }
                this.classList.add('active');
                
                const tabId = this.dataset.tab;
                document.querySelectorAll('.payment-form').forEach(function(form) {
                    form.style.display = 'none';
                });
                
                if (tabId === 'card') {
                    const cardPayment = document.getElementById('card-payment');
                    if (cardPayment) cardPayment.style.display = 'block';
                } else if (tabId === 'paypal') {
                    const paypalPayment = document.getElementById('paypal-payment');
                    if (paypalPayment) paypalPayment.style.display = 'block';
                }
            });
        });
        
        // Simulate payment processing
        const cardSubmit = document.getElementById('card-submit');
        if (cardSubmit) {
            cardSubmit.addEventListener('click', function() {
                this.textContent = 'Processing...';
                this.disabled = true;
                
                // Simulate API call
                setTimeout(() => {
                    const paymentModal = document.getElementById('payment-modal');
                    if (paymentModal) {
                        paymentModal.style.display = 'none';
                    }
                    alert('Subscription successful! You now have access to all premium features.');
                    
                    // Remove paywalls
                    document.querySelectorAll('.paywall-overlay').forEach(overlay => {
                        overlay.remove();
                    });
                    
                    document.querySelectorAll('.paywall-blur').forEach(card => {
                        card.classList.remove('paywall-blur');
                    });
                    
                    // Reset button
                    this.textContent = 'Subscribe Now';
                    this.disabled = false;
                    
                    // Update UI to show premium status
                    const upgradeButton = document.querySelector('.upgrade-button');
                    if (upgradeButton) {
                        upgradeButton.textContent = 'Premium Active';
                        upgradeButton.classList.add('premium-active');
                    }
                }, 2000);
            });
        }
        
        // Login form submission
        const loginSubmitButton = document.getElementById('login-button');
        if (loginSubmitButton) {
            loginSubmitButton.addEventListener('click', function() {
                const email = document.getElementById('email');
                const password = document.getElementById('password');
                
                if (!email || !password || !email.value || !password.value) {
                    alert('Please enter both email and password');
                    return;
                }
                
                this.textContent = 'Logging in...';
                this.disabled = true;
                
                // Simulate API call
                setTimeout(() => {
                    const authModal = document.getElementById('auth-modal');
                    if (authModal) {
                        authModal.style.display = 'none';
                    }
                    alert('Login successful!');
                    
                    // Reset button
                    this.textContent = 'Login';
                    this.disabled = false;
                    
                    // Update UI to show logged in state
                    const loginButton = document.querySelector('.login-button');
                    if (loginButton) {
                        loginButton.textContent = 'My Account';
                    }
                }, 1500);
            });
        }
        
        // Signup form submission
        const signupButton = document.getElementById('signup-button');
        if (signupButton) {
            signupButton.addEventListener('click', function() {
                const email = document.getElementById('signup-email');
                const password = document.getElementById('signup-password');
                const confirmPassword = document.getElementById('signup-password-confirm');
                
                if (!email || !password || !confirmPassword || !email.value || !password.value || !confirmPassword.value) {
                    alert('Please fill in all fields');
                    return;
                }
                
                if (password.value !== confirmPassword.value) {
                    alert('Passwords do not match');
                    return;
                }
                
                this.textContent = 'Creating account...';
                this.disabled = true;
                
                // Simulate API call
                setTimeout(() => {
                    const authModal = document.getElementById('auth-modal');
                    if (authModal) {
                        authModal.style.display = 'none';
                    }
                    alert('Account created successfully! You are now logged in.');
                    
                    // Reset button
                    this.textContent = 'Sign Up';
                    this.disabled = false;
                    
                    // Update UI to show logged in state
                    const loginButton = document.querySelector('.login-button');
                    if (loginButton) {
                        loginButton.textContent = 'My Account';
                    }
                }, 1500);
            });
        }
    }
    
    // Public API
    return {
        initialize: initialize
    };
})();
