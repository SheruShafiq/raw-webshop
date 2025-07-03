/**
 * Order management module
 * Handles checkout, order creation, and viewing orders
 */
class OrderManager {
    constructor() {
        this.orders = Storage.get(STORAGE_KEYS.ORDERS, []);
        this.init();
    }

    init() {
        this.attachEventListeners();
    }

    attachEventListeners() {
        const checkoutForm = document.getElementById('checkoutForm');
        const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
        const cancelCheckoutBtn = document.getElementById('cancelCheckoutBtn');
        const closeConfirmationBtn = document.getElementById('closeConfirmationBtn');
        const continueShoppingBtn = document.getElementById('continueShopping');

        if (checkoutForm) checkoutForm.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));
        if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', () => this.hideCheckout());
        if (cancelCheckoutBtn) cancelCheckoutBtn.addEventListener('click', () => this.hideCheckout());
        if (closeConfirmationBtn) closeConfirmationBtn.addEventListener('click', () => this.hideOrderConfirmation());
        if (continueShoppingBtn) continueShoppingBtn.addEventListener('click', () => this.hideOrderConfirmation());
    }

    showCheckout() {
        this.renderOrderSummary();
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) checkoutModal.classList.add('show');
    }

    hideCheckout() {
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) checkoutModal.classList.remove('show');
    }

    renderOrderSummary() {
        const orderItemsContainer = document.getElementById('orderItems');
        const orderTotalEl = document.getElementById('orderTotal');
        const cart = window.cartManager.cart;

        if (orderItemsContainer) {
            orderItemsContainer.innerHTML = cart.map(item => `
                <div class="order-item">
                    <span>${item.name} (x${item.quantity})</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');
        }

        if (orderTotalEl) {
            orderTotalEl.textContent = window.cartManager.getCartTotal().toFixed(2);
        }
    }

    handleCheckoutSubmit(event) {
        event.preventDefault();
        if (!this.validateCheckoutForm()) {
            return;
        }

        const formData = new FormData(event.target);
        const customerDetails = Object.fromEntries(formData.entries());

        const newOrder = {
            id: `order-${Date.now()}`,
            date: new Date().toISOString(),
            customer: customerDetails,
            items: window.cartManager.cart,
            total: window.cartManager.getCartTotal()
        };

        this.orders.push(newOrder);
        Storage.set(STORAGE_KEYS.ORDERS, this.orders);

        // Update product stock
        newOrder.items.forEach(item => {
            window.productManager.updateStock(item.id, item.quantity);
        });

        window.cartManager.clearCart();
        this.hideCheckout();
        this.showOrderConfirmation(newOrder);
    }

    validateCheckoutForm() {
        let isValid = true;
        const name = document.getElementById('customerName');
        const email = document.getElementById('customerEmail');
        const address = document.getElementById('customerAddress');

        // Simple validation
        if (!name.value.trim()) {
            this.showError(name, 'Name is required');
            isValid = false;
        } else {
            this.clearError(name);
        }

        if (!email.value.trim() || !/\S+@\S+\.\S+/.test(email.value)) {
            this.showError(email, 'Valid email is required');
            isValid = false;
        } else {
            this.clearError(email);
        }

        if (!address.value.trim()) {
            this.showError(address, 'Address is required');
            isValid = false;
        } else {
            this.clearError(address);
        }

        return isValid;
    }

    showError(input, message) {
        const errorSpan = input.nextElementSibling;
        if (errorSpan && errorSpan.classList.contains('error-message')) {
            errorSpan.textContent = message;
        }
    }

    clearError(input) {
        const errorSpan = input.nextElementSibling;
        if (errorSpan && errorSpan.classList.contains('error-message')) {
            errorSpan.textContent = '';
        }
    }

    showOrderConfirmation(order) {
        document.getElementById('orderIdDisplay').textContent = order.id;
        document.getElementById('confirmationTotal').textContent = order.total.toFixed(2);
        document.getElementById('orderConfirmationModal').classList.add('show');
    }

    hideOrderConfirmation() {
        document.getElementById('orderConfirmationModal').classList.remove('show');
    }

    getAllOrders() {
        return this.orders;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderManager;
}
