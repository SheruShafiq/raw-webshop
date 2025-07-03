/**
 * Products management module
 * Handles product data, fetching, filtering, and display
 */
class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.categories = new Set();
    }

    /**
     * Initialize the product manager
     */
    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.renderProducts();
        this.renderCategories();
    }

    /**
     * Load products from localStorage or default data
     */
    async loadProducts() {
        try {
            // Try to load from localStorage first
            let products = Storage.get(STORAGE_KEYS.PRODUCTS);
            
            if (!products || products.length === 0) {
                // Load default products if none in storage
                products = await this.getDefaultProducts();
                Storage.set(STORAGE_KEYS.PRODUCTS, products);
            }

            this.products = products;
            this.filteredProducts = [...this.products];
            this.extractCategories();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        }
    }

    /**
     * Get default product data
     */
    async getDefaultProducts() {
        const fallback = [
            {
                id: 1,
                name: "Wireless Bluetooth Headphones",
                description: "High-quality wireless headphones with noise cancellation and long battery life.",
                price: 79.99,
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
                stock: 25,
                featured: true
            },
            {
                id: 2,
                name: "Smart Watch Series 5",
                description: "Advanced smartwatch with health monitoring, GPS, and smartphone connectivity.",
                price: 199.99,
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
                stock: 15,
                featured: true
            },
            {
                id: 3,
                name: "Organic Cotton T-Shirt",
                description: "Comfortable, breathable organic cotton t-shirt available in multiple colors.",
                price: 24.99,
                category: "Clothing",
                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=200&fit=crop",
                stock: 50,
                featured: false
            },
            {
                id: 4,
                name: "Professional Coffee Maker",
                description: "Programmable coffee maker with thermal carafe and auto-shutoff feature.",
                price: 89.99,
                category: "Home & Kitchen",
                image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop",
                stock: 12,
                featured: true
            },
            {
                id: 5,
                name: "Gaming Mechanical Keyboard",
                description: "RGB backlit mechanical keyboard with customizable keys and macro support.",
                price: 129.99,
                category: "Electronics",
                image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=200&fit=crop",
                stock: 20,
                featured: false
            },
            {
                id: 6,
                name: "Yoga Mat Premium",
                description: "Non-slip, eco-friendly yoga mat with extra cushioning for comfortable practice.",
                price: 34.99,
                category: "Sports & Fitness",
                image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300&h=200&fit=crop",
                stock: 30,
                featured: false
            },
            {
                id: 7,
                name: "Stainless Steel Water Bottle",
                description: "Insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours.",
                price: 19.99,
                category: "Sports & Fitness",
                image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=200&fit=crop",
                stock: 40,
                featured: false
            },
            {
                id: 8,
                name: "LED Desk Lamp",
                description: "Adjustable LED desk lamp with touch controls and USB charging port.",
                price: 45.99,
                category: "Home & Kitchen",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
                stock: 18,
                featured: true
            }
        ];

        try {
            if (typeof API !== 'undefined') {
                const apiProducts = await API.get('/products');
                if (Array.isArray(apiProducts) && apiProducts.length > 0) {
                    return apiProducts;
                }
            }
        } catch (error) {
            console.error('Failed to fetch products from API:', error);
        }

        return fallback;
    }

    /**
     * Extract unique categories from products
     */
    extractCategories() {
        this.categories.clear();
        this.products.forEach(product => {
            this.categories.add(product.category);
        });
    }

    /**
     * Setup event listeners for search and filter
     */
    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value, categoryFilter.value);
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterProducts(searchInput.value, e.target.value);
            });
        }
    }

    /**
     * Filter products based on search term and category
     */
    filterProducts(searchTerm = '', category = '') {
        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = !category || product.category === category;
            
            return matchesSearch && matchesCategory;
        });

        this.renderProducts();
    }

    /**
     * Render category filter options
     */
    renderCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        Array.from(this.categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    /**
     * Render products grid
     */
    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <p>No products found matching your criteria.</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.filteredProducts.map(product => 
            this.createProductCard(product)
        ).join('');

        // Add event listeners to add to cart buttons
        this.attachProductEventListeners();
    }

    /**
     * Create HTML for a product card
     */
    createProductCard(product) {
        const stockStatus = product.stock > 0 ? 'In Stock' : 'Out of Stock';
        const stockClass = product.stock > 0 ? 'text-success' : 'text-danger';
        const addToCartDisabled = product.stock === 0 ? 'disabled' : '';

        return `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x200/e2e8f0/64748b?text=Image+Not+Found'">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-stock ${stockClass}">
                        <i class="fas fa-box"></i> ${stockStatus} (${product.stock})
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart-btn" 
                                data-product-id="${product.id}" 
                                ${addToCartDisabled}>
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to product cards
     */
    attachProductEventListeners() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.getAttribute('data-product-id'));
                const product = this.getProductById(productId);
                
                if (product && product.stock > 0) {
                    if (window.cartManager) {
                        window.cartManager.addToCart(product);
                        this.showSuccessMessage(`${product.name} added to cart!`);
                    }
                } else {
                    this.showError('Product is out of stock');
                }
            });
        });
    }

    /**
     * Get product by ID
     */
    getProductById(id) {
        return this.products.find(product => product.id === id);
    }

    /**
     * Add new product (admin function)
     */
    async addProduct(productData) {
        const payload = {
            ...productData,
            stock: parseInt(productData.stock) || 0
        };

        try {
            const created = await API.post('/products', payload);
            this.products.push(created);
            this.filteredProducts = [...this.products];
            this.extractCategories();
            this.saveProducts();
            this.renderProducts();
            this.renderCategories();
            return created;
        } catch (error) {
            console.error('Error adding product:', error);
            this.showError('Failed to add product');
            return null;
        }
    }

    /**
     * Update existing product (admin function)
     */
    async updateProduct(id, productData) {
        const index = this.products.findIndex(product => product.id === parseInt(id));

        if (index === -1) {
            return null;
        }

        const payload = {
            ...this.products[index],
            ...productData,
            id: parseInt(id),
            stock: parseInt(productData.stock) || 0
        };

        try {
            const updated = await API.put(`/products/${id}`, payload);
            this.products[index] = updated;
            this.filteredProducts = [...this.products];
            this.extractCategories();
            this.saveProducts();
            this.renderProducts();
            this.renderCategories();
            return updated;
        } catch (error) {
            console.error('Error updating product:', error);
            this.showError('Failed to update product');
            return null;
        }
    }

    /**
     * Delete product (admin function)
     */
    async deleteProduct(id) {
        const index = this.products.findIndex(product => product.id === parseInt(id));
        if (index === -1) {
            return null;
        }

        try {
            await API.delete(`/products/${id}`);
            const deletedProduct = this.products.splice(index, 1)[0];
            this.filteredProducts = [...this.products];
            this.extractCategories();
            this.saveProducts();
            this.renderProducts();
            this.renderCategories();
            return deletedProduct;
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Failed to delete product');
            return null;
        }
    }

    /**
     * Update product stock (when items are purchased)
     */
    updateStock(productId, quantity) {
        const product = this.getProductById(productId);
        if (product) {
            product.stock = Math.max(0, product.stock - quantity);
            this.saveProducts();
            this.renderProducts();
        }
    }

    /**
     * Reset products to default (admin function)
     */
    async resetProducts() {
        try {
            if (typeof API !== 'undefined') {
                await API.post('/reset');
            }
            const defaultProducts = await this.getDefaultProducts();
            this.products = defaultProducts;
            this.filteredProducts = [...this.products];
            this.extractCategories();
            this.saveProducts();
            this.renderProducts();
            this.renderCategories();
            this.showSuccessMessage('Products reset to default successfully!');
        } catch (error) {
            console.error('Error resetting products:', error);
            this.showError('Failed to reset products');
        }
    }

    /**
     * Save products to localStorage
     */
    saveProducts() {
        Storage.set(STORAGE_KEYS.PRODUCTS, this.products);
    }

    /**
     * Get next available ID
     */
    getNextId() {
        const maxId = this.products.reduce((max, product) => 
            Math.max(max, product.id), 0);
        return maxId + 1;
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'success-toast show';
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-success">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // Add close button functionality
        notification.querySelector('.close-success').addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorToast = document.getElementById('errorToast');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorToast && errorMessage) {
            errorMessage.textContent = message;
            errorToast.classList.add('show');

            // Auto hide after 5 seconds
            setTimeout(() => {
                errorToast.classList.remove('show');
            }, 5000);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductManager;
}
