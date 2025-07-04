function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

function addToCart(productId, variantId) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.productId === productId && item.variantId === variantId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ productId, variantId, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart');
}

function addToWishlist(productId) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    alert('Added to wishlist');
}

function displayProduct(product) {
    const container = document.getElementById('product-detail');
    container.innerHTML = '';
    const title = document.createElement('h1');
    title.textContent = product.name;
    container.appendChild(title);
    const desc = document.createElement('p');
    desc.textContent = product.description;
    container.appendChild(desc);

    const variantSelect = document.createElement('select');
    product.variants.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.name} - $${(v.priceCents / 100).toFixed(2)}`;
        variantSelect.appendChild(option);
    });
    container.appendChild(variantSelect);

    const addCartBtn = document.createElement('button');
    addCartBtn.textContent = 'Add to Cart';
    addCartBtn.addEventListener('click', () => {
        addToCart(product.id, variantSelect.value);
    });
    container.appendChild(addCartBtn);

    const addWishlistBtn = document.createElement('button');
    addWishlistBtn.textContent = 'Add to Wishlist';
    addWishlistBtn.addEventListener('click', () => {
        addToWishlist(product.id);
    });
    container.appendChild(addWishlistBtn);
}

function loadProduct() {
    const id = getQueryParam('id');
    if (!id) return;
    fetch(`http://localhost:3001/products/${encodeURIComponent(id)}`)
        .then(res => res.json())
        .then(product => displayProduct(product))
        .catch(() => {
            const container = document.getElementById('product-detail');
            container.textContent = 'Failed to load product';
        });
}

document.addEventListener('DOMContentLoaded', loadProduct);
