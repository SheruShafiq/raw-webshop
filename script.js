const API_BASE_URL = 'http://localhost:3000';

function waitForAuth() {
    return new Promise((resolve) => {
        if (typeof window.authSystem === 'undefined') {
            const checkAuth = setInterval(() => {
                if (typeof window.authSystem !== 'undefined') {
                    clearInterval(checkAuth);
                    resolve();
                }
            }, 50);
        } else {
            resolve();
        }
    });
}

function getPagePath(page) {
    const path = window.location.pathname;
    const base = path.includes('/pages/')
        ? path.substring(0, path.indexOf('/pages/'))
        : path.substring(0, path.lastIndexOf('/'));
    return `${base}/pages/${page}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    await waitForAuth();
    
    const currentPage = window.location.pathname;
    
    await initializeCart();
    updateCartUI();
    
    const cartLink = document.getElementById('cart-link');
    if (cartLink) {
        cartLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = getPagePath('cart.html');
        });
    }
    if (currentPage.includes('product.html') || currentPage.endsWith('/product.html')) {
        loadProductDetail();
    } else if (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
        loadProducts();
    } else if (currentPage.includes('cart.html')) {
        await initializeCart(); 
        loadCartPage();
    }
});

async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function fetchProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch product. Status: ${response.status}`);
        }
        const product = await response.json();
        return product;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

function createProductCard(product) {
    const price = product.price.toFixed(2);
    const rawImage = product.images[0] || 'https://via.placeholder.com/300x200?text=No+Image';
    const image = rawImage;

    const shortDescription = product.description.length > 100
        ? product.description.substring(0, 100) + '...'
        : product.description;

    return `
        <div class="product-card" data-product-id="${product.id}">
            <img src="${image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${shortDescription}</p>
                <div class="product-price">€${price}</div>
                <div class="product-actions">
                    <button class="btn btn-primary view-details-btn" data-product-id="${product.id}">View Details</button>
                    <button class="btn btn-secondary add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

async function loadProducts() {
    const products = await fetchProducts();
    const container = document.getElementById('products-container');

    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p>No products available.</p>';
        return;
    }

    container.innerHTML = products.map(product => createProductCard(product)).join('');

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            viewProduct(productId);
        });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const productId = e.target.getAttribute('data-product-id');
            await addToCart(productId);
        });
    });
}

function viewProduct(productId) {
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const targetUrl = `${baseUrl}pages/product.html?id=${productId}`;
    window.location.href = targetUrl;
}

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const container = document.getElementById('product-detail-container');

    if (!container) {
        console.error('Product detail container not found!');
        return;
    }

    if (!productId) {
        console.error('No product ID found in URL');
        container.innerHTML = '<p>Product ID not found in URL. Please select a product from the <a href="../index.html">home page</a>.</p>';
        return;
    }

    container.innerHTML = '<p>Loading product details...</p>';

    try {
        const product = await fetchProduct(productId);

        if (!product) {
            console.error('Product not found for ID:', productId);
            container.innerHTML = '<p>Product not found. Please select a product from the <a href="../index.html">home page</a>.</p>';
            return;
        }

        container.innerHTML = createProductDetail(product);
        
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                await addToCart(productId);
            });
        });
    } catch (error) {
        console.error('Error loading product detail:', error);
        container.innerHTML = '<p>Error loading product details. Please try again. Error: ' + error.message + '</p>';
    }
}

function createProductDetail(product) {
    const price = product.price.toFixed(2);

    const images = product.images && product.images.length > 0
        ? product.images.map((image, index) => {
            const imageSrc = image.startsWith('assets/') && window.location.pathname.includes('/pages/')
                ? `../${image}`
                : image;
            return `<img src="${imageSrc}" alt="${product.name} ${index + 1}" class="product-detail-image">`;
        }).join('')
        : '<img src="https://via.placeholder.com/400x300?text=No+Image" alt="No Image" class="product-detail-image">';

    const tags = product.tags && product.tags.length > 0
        ? product.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
        : '<span class="tag">No tags</span>';

    return `
        <div class="product-detail">
            <div class="product-images">
                ${images}
            </div>
            <div class="product-info">
                <h1>${product.name}</h1>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <p><strong>Category ID:</strong> ${product.categoryId}</p>
                    <p><strong>Created:</strong> ${new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="product-tags">
                    <h4>Tags:</h4>
                    ${tags}
                </div>
                <div class="product-price-display">
                    <h3>Price: €${price}</h3>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                    <button onclick="window.history.back()" class="btn btn-outline">← Back to Products</button>
                </div>
            </div>
        </div>
    `;
}

let currentCart = null;

async function initializeCart() {
    if (window.currentUser) {
        try {
            const response = await fetch(`${API_BASE_URL}/carts?userId=${window.currentUser.id}`);
            const carts = await response.json();
            currentCart = carts.find(cart => cart.userId === window.currentUser.id) || null;
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    } else {
        const guestCart = localStorage.getItem('guestCart');
        if (guestCart) {
            currentCart = JSON.parse(guestCart);
        } else {
            currentCart = {
                id: `guest_cart_${Date.now()}`,
                userId: null,
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
            localStorage.setItem('guestCart', JSON.stringify(currentCart));
        }
    }
    updateCartUI();
}

async function addToCart(productId, quantity = 1) {
    try {
        if (currentCart === null) {
            await initializeCart();
        }
        
        if (window.currentUser) {
            await addToUserCart(productId, quantity);
        } else {
            addToGuestCart(productId, quantity);
        }
        
        showMessage('Product added to cart!', 'success');
        updateCartUI();
        
        if (window.location.pathname.includes('cart.html')) {
            loadCartPage();
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add product to cart. Please try again.', 'error');
        return false;
    }
}

async function addToUserCart(productId, quantity) {
    if (!currentCart) {
        const newCart = {
            id: `cart_${window.currentUser.id}_${Date.now()}`,
            userId: window.currentUser.id,
            items: [{
                productId: productId,
                quantity: quantity
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const response = await fetch(`${API_BASE_URL}/carts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCart)
        });
        
        if (response.ok) {
            currentCart = newCart;
        }
    } else {
        const existingItem = currentCart.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            currentCart.items.push({
                productId: productId,
                quantity: quantity
            });
        }
        
        currentCart.updatedAt = new Date().toISOString();
        
        const response = await fetch(`${API_BASE_URL}/carts/${currentCart.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentCart)
        });
    }
}

function addToGuestCart(productId, quantity) {
    if (!currentCart) {
        currentCart = {
            id: `guest_cart_${Date.now()}`,
            userId: null,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
    
    const existingItem = currentCart.items.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        currentCart.items.push({
            productId: productId,
            quantity: quantity
        });
    }
    
    currentCart.updatedAt = new Date().toISOString();
    localStorage.setItem('guestCart', JSON.stringify(currentCart));
}

async function removeFromCart(productId) {
    if (!currentCart) return;
    
    currentCart.items = currentCart.items.filter(item => item.productId !== productId);
    
    try {
        if (window.currentUser) {
            await fetch(`${API_BASE_URL}/carts/${currentCart.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentCart)
            });
        } else {
            localStorage.setItem('guestCart', JSON.stringify(currentCart));
        }
        
        updateCartUI();
        showMessage('Item removed from cart', 'success');
    } catch (error) {
        console.error('Error removing from cart:', error);
        showMessage('Failed to remove item from cart', 'error');
    }
}

async function updateCartItemQuantity(productId, newQuantity) {
    if (!currentCart) return;
    
    const item = currentCart.items.find(item => item.productId === productId);
    
    if (item) {
        if (newQuantity <= 0) {
            await removeFromCart(productId);
            return;
        }
        
        item.quantity = newQuantity;
        currentCart.updatedAt = new Date().toISOString();
        
        try {
            if (window.currentUser) {
                await fetch(`${API_BASE_URL}/carts/${currentCart.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentCart)
                });
            } else {
                localStorage.setItem('guestCart', JSON.stringify(currentCart));
            }
            
            updateCartUI();
        } catch (error) {
            console.error('Error updating cart:', error);
            showMessage('Failed to update cart', 'error');
        }
    }
}

function updateCartUI() {
    const cartLink = document.getElementById('cart-link');
    if (cartLink && currentCart) {
        const itemCount = currentCart.items.reduce((total, item) => total + item.quantity, 0);
        cartLink.textContent = `Cart (${itemCount})`;
    }
}


async function createOrder(orderData) {
    try {
        const order = {
            id: `ord_${Date.now()}`,
            orderNumber: `2025-${String(Date.now()).slice(-6)}`,
            userId: window.currentUser ? window.currentUser.id : null,
            statusId: 1,
            currency: 'EUR',
            total: orderData.total,
            items: orderData.items,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        
        if (response.ok) {
            await clearCart();
            return order;
        } else {
            throw new Error('Failed to create order');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

async function clearCart() {
    if (!currentCart) return;
    
    try {
        if (window.currentUser) {
            await fetch(`${API_BASE_URL}/carts/${currentCart.id}`, {
                method: 'DELETE'
            });
        } else {
            localStorage.removeItem('guestCart');
        }
        
        currentCart = null;
        updateCartUI();
    } catch (error) {
        console.error('Error clearing cart:', error);
    }
}

async function loadCartPage() {
    const container = document.getElementById('cart-container');
    if (!container) {
        console.error('Cart container not found!');
        return;
    }
    
    if (!currentCart) {
        await initializeCart();
    }
    
    if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
        container.innerHTML = `
            <p>Your cart is empty.</p>
            <div class="cart-actions">
                <a href="../index.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        return;
    }
    
    try {
        let itemsHtml = '';
        let subtotal = 0;
        
        for (const item of currentCart.items) {
            const product = await fetchProduct(item.productId);
            
            if (!product) {
                console.error('Product not found for ID:', item.productId);
                continue;
            }
            
            const unitPrice = product.price;
            const lineTotal = unitPrice * item.quantity;
            subtotal += lineTotal;
            
            itemsHtml += `
                <tr data-product-id="${item.productId}">
                    <td>${product.name}</td>
                    <td>€${unitPrice.toFixed(2)}</td>
                    <td>
                        <div class="quantity-control">
                            <button class="quantity-btn decrease-btn">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99">
                            <button class="quantity-btn increase-btn">+</button>
                        </div>
                    </td>
                    <td>€${lineTotal.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-outline remove-item-btn">Remove</button>
                    </td>
                </tr>`;
        }
        
        const grandTotal = subtotal;
        
        container.innerHTML = `
            <table class="cart-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="cart-summary">
                <p><strong>Grand Total:</strong> €${grandTotal.toFixed(2)}</p>
                <div class="cart-actions">
                    <button id="clear-cart-btn" class="btn btn-outline">Clear Cart</button>
                    <button id="checkout-btn" class="btn btn-primary">Checkout</button>
                </div>
            </div>
        `;
        
        setupCartEventListeners();
        
    } catch (error) {
        console.error('Error loading cart page:', error);
        container.innerHTML = `<p>Error loading cart: ${error.message}</p>`;
    }
}


function setupCartEventListeners() {
    document.querySelectorAll('.quantity-control .quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const productId = row.dataset.productId;
            const input = row.querySelector('.quantity-input');
            let currentQty = parseInt(input.value, 10);
            
            if (e.target.classList.contains('decrease-btn')) {
                currentQty = Math.max(1, currentQty - 1);
            } else if (e.target.classList.contains('increase-btn')) {
                currentQty = Math.min(99, currentQty + 1);
            }
            
            input.value = currentQty;
            updateCartItemQuantity(productId, currentQty);
        });
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const row = e.target.closest('tr');
            const productId = row.dataset.productId;
            let newQty = parseInt(e.target.value, 10);
            
            if (isNaN(newQty) || newQty < 1) {
                newQty = 1;
                e.target.value = 1;
            } else if (newQty > 99) {
                newQty = 99;
                e.target.value = 99;
            }
            
            updateCartItemQuantity(productId, newQty);
        });
    });
    
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const productId = row.dataset.productId;
            
            removeFromCart(productId).then(() => {
                loadCartPage();
            });
        });
    });
    
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear your cart?')) {
                await clearCart();
                loadCartPage();
            }
        });
    }
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            handleCheckout();
        });
    }
}

async function handleCheckout() {
    try {
        if (!window.currentUser) {
            showMessage('Please login to place an order.', 'error');
            setTimeout(() => window.location.href = getPagePath('login.html'), 1000);
            return;
        }
        
        const detailedItems = await Promise.all(currentCart.items.map(async item => {
            const product = await fetchProduct(item.productId);
            return {
                productId: item.productId,
                unitPrice: product.price,
                quantity: item.quantity,
                subtotal: product.price * item.quantity
            };
        }));
        
        const total = detailedItems.reduce((sum, i) => sum + i.subtotal, 0);
        
        await createOrder({ items: detailedItems, total });
        showMessage('Order placed successfully!', 'success');
    } catch (error) {
        console.error('Checkout error:', error);
        showMessage('Order failed. Please try again.', 'error');
    }
}

function showMessage(message, type = 'info') {
    let messageEl = document.getElementById('global-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'global-message';
        messageEl.className = 'global-message';
        document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `global-message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}
