// Basic cart and wishlist logic using localStorage

function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
}

function saveWishlist(wishlist) {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function formatPrice(cents) {
    return '€' + (cents / 100).toFixed(2);
}

function renderCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    const cart = getCart();
    container.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';

        const name = document.createElement('span');
        name.textContent = item.name + ' (' + (item.variantName || '') + ')';

        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.min = 1;
        qtyInput.value = item.quantity;
        qtyInput.addEventListener('change', (e) => {
            updateQuantity(index, parseInt(e.target.value, 10));
        });

        const price = document.createElement('span');
        const itemTotal = item.priceCents * item.quantity;
        price.textContent = formatPrice(itemTotal);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeItem(index));

        div.appendChild(name);
        div.appendChild(qtyInput);
        div.appendChild(price);
        div.appendChild(removeBtn);
        container.appendChild(div);

        total += itemTotal;
    });

    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = formatPrice(total);
}

function updateQuantity(index, qty) {
    if (qty < 1) qty = 1;
    const cart = getCart();
    cart[index].quantity = qty;
    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

function renderWishlist() {
    const container = document.getElementById('wishlistItems');
    if (!container) return;

    const items = getWishlist();
    container.innerHTML = '';

    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'wish-item';

        const name = document.createElement('span');
        name.textContent = item.name + ' (' + (item.variantName || '') + ')';

        const moveBtn = document.createElement('button');
        moveBtn.textContent = 'Add to Cart';
        moveBtn.addEventListener('click', () => moveToCart(index));

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeWish(index));

        div.appendChild(name);
        div.appendChild(moveBtn);
        div.appendChild(removeBtn);
        container.appendChild(div);
    });
}

function moveToCart(wishIndex) {
    const wishlist = getWishlist();
    const item = wishlist.splice(wishIndex, 1)[0];
    saveWishlist(wishlist);

    const cart = getCart();
    const existing = cart.find(ci => ci.productId === item.productId && ci.variantId === item.variantId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
    renderWishlist();
}

function removeWish(index) {
    const wishlist = getWishlist();
    wishlist.splice(index, 1);
    saveWishlist(wishlist);
    renderWishlist();
}

function initPage() {
    if (document.getElementById('cartItems')) {
        renderCart();
    }
    if (document.getElementById('wishlistItems')) {
        renderWishlist();
    }
}

document.addEventListener('DOMContentLoaded', initPage);
