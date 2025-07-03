/**
 * Shopping Cart management module
 * Handles adding, removing, and updating cart items
 */
class CartManager {
    constructor() {
        this.cart = Storage.get(STORAGE_KEYS.CART, []);
        this.init();
    }

    init() {
        this.updateCartCount();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const cartBtn = document.getElementById('cartBtn');
        const closeCartBtn = document.getElementById('closeCartBtn');
        const clearCartBtn = document.getElementById('clearCartBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartBtn) cartBtn.addEventListener('click', () => this.showCart());
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => this.hideCart());
        if (clearCartBtn) clearCartBtn.addEventListener('click', () => this.clearCart());
        if (checkoutBtn) checkoutBtn.addEventListener('click', () => this.checkout());
    }

    addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ ...product, quantity });
        }

        this.saveCart();
        this.updateCartCount();
        this.renderCartItems();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
        this.renderCartItems();
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
                this.renderCartItems();
            }
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        this.renderCartItems();
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    saveCart() {
        Storage.set(STORAGE_KEYS.CART, this.cart);
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    showCart() {
        this.renderCartItems();
        const cartModal = document.getElementById('cartModal');
        if (cartModal) cartModal.classList.add('show');
    }

    hideCart() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) cartModal.classList.remove('show');
    }

    renderCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');

        if (!cartItemsContainer) return;

        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cartItemsContainer.innerHTML = this.cart.map(item => this.createCartItem(item)).join('');
            this.attachCartItemEventListeners();
        }

        if (cartTotalEl) {
            cartTotalEl.textContent = this.getCartTotal().toFixed(2);
        }
    }

    createCartItem(item) {
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn decrease-quantity">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                    <button class="quantity-btn increase-quantity">+</button>
                </div>
                <button class="btn btn-danger remove-from-cart">Remove</button>
            </div>
        `;
    }

    attachCartItemEventListeners() {
        const cartItemsContainer = document.getElementById('cartItems');
        cartItemsContainer.querySelectorAll('.remove-from-cart').forEach(btn => {
            const productId = parseInt(btn.closest('.cart-item').dataset.productId);
            btn.addEventListener('click', () => this.removeFromCart(productId));
        });

        cartItemsContainer.querySelectorAll('.quantity-input').forEach(input => {
            const productId = parseInt(input.closest('.cart-item').dataset.productId);
            input.addEventListener('change', (e) => this.updateQuantity(productId, parseInt(e.target.value)));
        });

        cartItemsContainer.querySelectorAll('.decrease-quantity').forEach(btn => {
            const productId = parseInt(btn.closest('.cart-item').dataset.productId);
            const input = btn.nextElementSibling;
            btn.addEventListener('click', () => {
                const newQuantity = parseInt(input.value) - 1;
                this.updateQuantity(productId, newQuantity);
            });
        });

        cartItemsContainer.querySelectorAll('.increase-quantity').forEach(btn => {
            const productId = parseInt(btn.closest('.cart-item').dataset.productId);
            const input = btn.previousElementSibling;
            btn.addEventListener('click', () => {
                const newQuantity = parseInt(input.value) + 1;
                this.updateQuantity(productId, newQuantity);
            });
        });
    }

    checkout() {
        if (this.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        this.hideCart();
        if (window.orderManager) {
            window.orderManager.showCheckout();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}
