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


function getAssetPath(assetPath) {
    const currentPath = window.location.pathname;
    const isInSubfolder = currentPath.includes('/pages/');

    if (isInSubfolder) {
        return `../assets/${assetPath}`;
    } else {
        return `assets/${assetPath}`;
    }
}


function getAssetUrl(assetPath) {
    const baseUrl = window.location.origin;
    const basePath = window.location.pathname.includes('/pages/')
        ? window.location.pathname.replace('/pages/', '/').split('/').slice(0, -1).join('/')
        : window.location.pathname.split('/').slice(0, -1).join('/');

    return `${baseUrl}${basePath}/assets/${assetPath}`;
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
    
    
    const wishlistLink = document.getElementById('wishlist-link');
    if (wishlistLink) {
        wishlistLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = getPagePath('wishlist.html');
        });
    }

    if (currentPage.includes('product.html') || currentPage.endsWith('/product.html')) {
        loadProductDetail();
    } else if (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
        loadProducts();
    } else if (currentPage.includes('cart.html')) {
        
        await initializeCart(); 
        loadCartPage();
    } else if (currentPage.includes('wishlist.html')) {
        loadWishlistPage();
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
    const mainVariant = product.variants[0];
    const price = (mainVariant.priceCents / 100).toFixed(2);
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
                    <button class="btn btn-secondary add-to-cart-btn" data-product-id="${product.id}" data-variant-id="${mainVariant.id}">Add to Cart</button>
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
            const variantId = e.target.getAttribute('data-variant-id');
            
            await addToCart(productId, variantId);
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
                const variantId = e.target.getAttribute('data-variant-id');
                
                await addToCart(productId, variantId);
            });
        });

        
        document.querySelectorAll('.add-to-wishlist-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                
                await addToWishlist(productId);
            });
        });
    } catch (error) {
        console.error('Error loading product detail:', error);
        container.innerHTML = '<p>Error loading product details. Please try again. Error: ' + error.message + '</p>';
    }
}

function createProductDetail(product) {
    


    const variants = product.variants && product.variants.length > 0
        ? product.variants.map(variant => {
            const price = (variant.priceCents / 100).toFixed(2);
            const dimensions = variant.dimensionsCm ?
                Object.entries(variant.dimensionsCm).map(([key, value]) => `${key}: ${value}cm`).join(', ') :
                'N/A';
            const weight = variant.weightGrams ? `${variant.weightGrams}g` : 'N/A';

            return `
                <div class="variant-option" data-variant-id="${variant.id}">
                    <h4>${variant.name}</h4>
                    <p class="variant-price"><strong>€${price}</strong></p>
                    <p class="variant-sku">SKU: ${variant.sku}</p>
                    <p class="variant-dimensions">Dimensions: ${dimensions}</p>
                    <p class="variant-weight">Weight: ${weight}</p>
                    <div class="variant-actions">
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}" data-variant-id="${variant.id}">Add to Cart</button>
                        <button class="btn btn-secondary add-to-wishlist-btn" data-product-id="${product.id}">Add to Wishlist</button>
                    </div>
                </div>
            `;
        }).join('')
        : '<p>No variants available</p>';

    const images = product.images && product.images.length > 0
        ? product.images.map((image, index) => {

            const imageSrc = image.startsWith('assets/') && window.location.pathname.includes('/pages/')
                ? `../${image}`
                : image;
            return `<img src="${imageSrc}" alt="${product.name} ${index + 1}" class="product-detail-image"">`;
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
                <div class="product-variants">
                    <h3>Available Options:</h3>
                    ${variants}
                </div>
                <div class="product-actions">
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

async function addToCart(productId, variantId, quantity = 1) {
    
    

    try {
        
        if (currentCart === null) {
            
            await initializeCart();
        }
        
        
        
        
        if (window.currentUser) {
            
            
            await addToUserCart(productId, variantId, quantity);
        } else {
            
            
            addToGuestCart(productId, variantId, quantity);
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

async function addToUserCart(productId, variantId, quantity) {
    if (!currentCart) {
        
        const newCart = {
            id: `cart_${window.currentUser.id}_${Date.now()}`,
            userId: window.currentUser.id,
            items: [{
                productId: productId,
                variantId: variantId,
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
        
        const existingItem = currentCart.items.find(item => 
            item.productId === productId && item.variantId === variantId
        );
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            currentCart.items.push({
                productId: productId,
                variantId: variantId,
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

function addToGuestCart(productId, variantId, quantity) {
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
    
    const existingItem = currentCart.items.find(item => 
        item.productId === productId && item.variantId === variantId
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        currentCart.items.push({
            productId: productId,
            variantId: variantId,
            quantity: quantity
        });
    }
    
    currentCart.updatedAt = new Date().toISOString();
    localStorage.setItem('guestCart', JSON.stringify(currentCart));
}

async function removeFromCart(productId, variantId) {
    if (!currentCart) return;
    
    currentCart.items = currentCart.items.filter(item => 
        !(item.productId === productId && item.variantId === variantId)
    );
    
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

async function updateCartItemQuantity(productId, variantId, newQuantity) {
    if (!currentCart) return;
    
    const item = currentCart.items.find(item => 
        item.productId === productId && item.variantId === variantId
    );
    
    if (item) {
        if (newQuantity <= 0) {
            await removeFromCart(productId, variantId);
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

async function addToWishlist(productId) {
    if (!window.currentUser) {
        showMessage('Please login to add items to wishlist', 'error');
        return;
    }
    
    try {
        
        const response = await fetch(`${API_BASE_URL}/wishlists?userId=${window.currentUser.id}`);
        const wishlists = await response.json();
        let wishlist = wishlists[0];
        
        if (!wishlist) {
            
            wishlist = {
                userId: window.currentUser.id,
                productIds: [productId],
                addedAt: new Date().toISOString()
            };
            
            await fetch(`${API_BASE_URL}/wishlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(wishlist)
            });
        } else {
            
            if (!wishlist.productIds.includes(productId)) {
                wishlist.productIds.push(productId);
                
                await fetch(`${API_BASE_URL}/wishlists/${wishlist.id || window.currentUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(wishlist)
                });
            } else {
                showMessage('Product already in wishlist', 'info');
                return;
            }
        }
        
        showMessage('Product added to wishlist!', 'success');
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showMessage('Failed to add to wishlist', 'error');
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
            shippingAddressId: orderData.shippingAddressId,
            billingAddressId: orderData.billingAddressId,
            couponId: orderData.couponId || null,
            totals: orderData.totals,
            Items: orderData.items,
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
            
            const variant = product.variants.find(v => v.id === item.variantId);
            
            if (!variant) {
                console.error('Variant not found:', item.variantId);
                continue;
            }
            
            const unitPrice = variant.priceCents;
            const lineTotal = unitPrice * item.quantity;
            subtotal += lineTotal;
            
            itemsHtml += `
                <tr data-product-id="${item.productId}" data-variant-id="${item.variantId}">
                    <td>${product.name}</td>
                    <td>${variant.name}</td>
                    <td>€${(unitPrice/100).toFixed(2)}</td>
                    <td>
                        <div class="quantity-control">
                            <button class="quantity-btn decrease-btn">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99">
                            <button class="quantity-btn increase-btn">+</button>
                        </div>
                    </td>
                    <td>€${(lineTotal/100).toFixed(2)}</td>
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
                        <th>Variant</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="cart-summary">
                <p><strong>Grand Total:</strong> €${(grandTotal/100).toFixed(2)}</p>
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
            const variantId = row.dataset.variantId;
            const input = row.querySelector('.quantity-input');
            let currentQty = parseInt(input.value, 10);
            
            if (e.target.classList.contains('decrease-btn')) {
                currentQty = Math.max(1, currentQty - 1);
            } else if (e.target.classList.contains('increase-btn')) {
                currentQty = Math.min(99, currentQty + 1);
            }
            
            
            input.value = currentQty;
            updateCartItemQuantity(productId, variantId, currentQty);
        });
    });
    
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const row = e.target.closest('tr');
            const productId = row.dataset.productId;
            const variantId = row.dataset.variantId;
            let newQty = parseInt(e.target.value, 10);
            
            
            if (isNaN(newQty) || newQty < 1) {
                newQty = 1;
                e.target.value = 1;
            } else if (newQty > 99) {
                newQty = 99;
                e.target.value = 99;
            }
            
            
            updateCartItemQuantity(productId, variantId, newQty);
        });
    });
    
    
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const productId = row.dataset.productId;
            const variantId = row.dataset.variantId;
            
            
            removeFromCart(productId, variantId).then(() => {
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
    } else {
        console.warn('Clear cart button not found');
    }
    
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            
            handleCheckout();
        });
    } else {
        console.warn('Checkout button not found');
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
            const variant = product.variants.find(v => v.id === item.variantId);
            return {
                productId: item.productId,
                variantId: item.variantId,
                unitPriceCents: variant.priceCents,
                quantity: item.quantity,
                subtotalCents: variant.priceCents * item.quantity
            };
        }));
        const totals = {
            subtotalCents: detailedItems.reduce((sum, i) => sum + i.subtotalCents, 0),
            discountCents: 0,
            taxCents: 0,
            shippingCents: 0,
            grandTotalCents: detailedItems.reduce((sum, i) => sum + i.subtotalCents, 0)
        };
        await createOrder({ items: detailedItems, totals, shippingAddressId: null, billingAddressId: null, couponId: null });
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








async function loadWishlistPage() {
  const container = document.getElementById('wishlist-container');
  if (!container) return;
  if (!window.currentUser) {
    container.innerHTML = '<p>Please log in to view your wishlist.</p>';
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/wishlists?userId=${window.currentUser.id}`);
    const [wishlist] = await res.json();
    if (!wishlist || wishlist.productIds.length === 0) {
      container.innerHTML = '<p>Your wishlist is empty.</p>';
      return;
    }
    
    let itemsHtml = '';
    for (const prodId of wishlist.productIds) {
      const product = await fetchProduct(prodId);
      if (!product) continue;
      const price = (product.variants[0].priceCents / 100).toFixed(2);
      itemsHtml += `
        <div class="wishlist-item">
          <span>${product.name} – €${price}</span>
          <button class="btn btn-outline" onclick="removeFromWishlist('${prodId}')">Remove</button>
        </div>`;
    }
    container.innerHTML = itemsHtml;
  } catch (error) {
    console.error('Failed to load wishlist:', error);
    container.innerHTML = '<p>Error loading wishlist.</p>';
  }
}

async function removeFromWishlist(productId) {
  try {
    
    const res = await fetch(`${API_BASE_URL}/wishlists?userId=${window.currentUser.id}`);
    const [wishlist] = await res.json();
    if (!wishlist) return;
    
    wishlist.productIds = wishlist.productIds.filter(id => id !== productId);
    await fetch(`${API_BASE_URL}/wishlists/${wishlist.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wishlist)
    });
    showMessage('Product removed from wishlist.', 'success');
    loadWishlistPage();  
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    showMessage('Could not remove item from wishlist.', 'error');
  }
}
