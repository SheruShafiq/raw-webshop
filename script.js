const API_BASE_URL = 'http://localhost:3001';


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

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    console.log('Current page:', currentPage);
    console.log('URL params:', urlParams.toString());
    console.log('Product ID from URL:', urlParams.get('id'));

    if (currentPage.includes('product.html') || currentPage.endsWith('/product.html')) {
        loadProductDetail();
    } else if (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
        loadProducts();
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
            throw new Error('Failed to fetch product');
        }
        return await response.json();
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
                    <button onclick="addToCart('${product.id}', '${mainVariant.id}')" class="btn btn-secondary">Add to Cart</button>
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
}

function viewProduct(productId) {
    console.log('Navigating to product:', productId);


    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const targetUrl = `${baseUrl}pages/product.html?id=${productId}`;

    console.log('Target URL:', targetUrl);

    window.location.href = targetUrl;
}

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    console.log('Current URL:', window.location.href);
    console.log('URL Search params:', window.location.search);
    console.log('Extracted product ID:', productId);

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
        console.log('Fetching product with ID:', productId);
        const product = await fetchProduct(productId);
        console.log('Fetched product data:', product);

        if (!product) {
            console.error('Product not found for ID:', productId);
            container.innerHTML = '<p>Product not found. Please select a product from the <a href="../index.html">home page</a>.</p>';
            return;
        }

        console.log('Creating product detail HTML');
        container.innerHTML = createProductDetail(product);
        console.log('Product detail HTML created successfully');
    } catch (error) {
        console.error('Error loading product detail:', error);
        container.innerHTML = '<p>Error loading product details. Please try again. Error: ' + error.message + '</p>';
    }
}

function createProductDetail(product) {
    console.log('Creating product detail for:', product);


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
                        <button onclick="addToCart('${product.id}', '${variant.id}')" class="btn btn-primary">Add to Cart</button>
                        <button onclick="addToWishlist('${product.id}')" class="btn btn-secondary">Add to Wishlist</button>
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


function addToCart(productId, variantId) {
    console.log('Adding to cart:', productId, variantId);

    alert(`Product ${productId} (variant ${variantId}) added to cart!`);
}

function addToWishlist(productId) {
    console.log('Adding to wishlist:', productId);

    alert(`Product ${productId} added to wishlist!`);
}







