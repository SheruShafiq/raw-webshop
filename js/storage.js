/**
 * Storage utility module for managing localStorage operations
 * Provides centralized methods for storing and retrieving data
 */
class Storage {
    /**
     * Get data from localStorage
     * @param {string} key - The key to retrieve
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} The parsed data or default value
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Set data in localStorage
     * @param {string} key - The key to store
     * @param {*} value - The value to store
     * @returns {boolean} Success status
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - The key to remove
     * @returns {boolean} Success status
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    /**
     * Clear all localStorage data
     * @returns {boolean} Success status
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} Availability status
     */
    static isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get storage size information
     * @returns {Object} Storage size information
     */
    static getStorageInfo() {
        if (!Storage.isAvailable()) {
            return { available: false };
        }

        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }

        return {
            available: true,
            used: total,
            usedMB: (total / (1024 * 1024)).toFixed(2)
        };
    }
}

// Storage keys constants
const STORAGE_KEYS = {
    CART: 'webshop_cart',
    ORDERS: 'webshop_orders',
    PRODUCTS: 'webshop_products',
    ADMIN_SESSION: 'webshop_admin_session',
    CURRENT_USER: 'webshop_current_user',
    USER_PREFERENCES: 'webshop_user_preferences'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage, STORAGE_KEYS };
}
