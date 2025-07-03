/**
 * Main application initialization and configuration
 */

// API Configuration
const API_BASE_URL = 'http://localhost:3001';

// Application state
let productManager;
let cartManager;
let orderManager;
let authManager;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Show loading spinner
        showLoading();
        
        // Initialize managers
        authManager = new AuthManager();
        productManager = new ProductManager();
        cartManager = new CartManager();
        orderManager = new OrderManager();
        
        // Initialize all components
        await productManager.init();
        cartManager.init();
        orderManager.init();
        
        // Setup global event listeners
        setupGlobalEventListeners();
        
        // Hide loading spinner
        hideLoading();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showErrorMessage('Failed to initialize application. Please refresh the page.');
        hideLoading();
    }
});

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Modal backdrop clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });

    // Error toast close button
    const errorToast = document.getElementById('errorToast');
    if (errorToast) {
        const closeBtn = errorToast.querySelector('.close-error');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                errorToast.classList.remove('show');
            });
        }
    }

    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => modal.classList.remove('show'));
        }
    });
}

/**
 * API utility functions
 */
class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw new Error('Network request failed. Please check your connection.');
        }
    }

    static async get(endpoint) {
        return this.request(endpoint);
    }

    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    static async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
}

/**
 * Authentication Manager
 */
class AuthManager {
    constructor() {
        this.currentUser = Storage.get(STORAGE_KEYS.CURRENT_USER, null);
    }

    async login(email, password) {
        try {
            const users = await API.get('/users');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                this.currentUser = { ...user };
                delete this.currentUser.password; // Don't store password
                Storage.set(STORAGE_KEYS.CURRENT_USER, this.currentUser);
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: 'Invalid email or password' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    logout() {
        this.currentUser = null;
        Storage.remove(STORAGE_KEYS.CURRENT_USER);
        if (cartManager) {
            cartManager.clearCart();
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

/**
 * Utility functions
 */
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('show');
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('show');
}

function showErrorMessage(message) {
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorToast && errorMessage) {
        errorMessage.textContent = message;
        errorToast.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorToast.classList.remove('show');
        }, 5000);
    }
}

function showSuccessMessage(message) {
    // Create a temporary success toast
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <span>${message}</span>
        <button class="close-success">&times;</button>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
    
    // Manual close
    toast.querySelector('.close-success').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateString));
}

// Make managers globally available
window.API = API;
window.authManager = authManager;
window.productManager = productManager;
window.cartManager = cartManager;
window.orderManager = orderManager;
window.showErrorMessage = showErrorMessage;
window.showSuccessMessage = showSuccessMessage;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
