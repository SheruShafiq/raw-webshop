const ADMIN_API_BASE_URL = '/api';

let currentEditingProduct = null;
let currentEditingCategory = null;

document.addEventListener('DOMContentLoaded', () => {
    
    if (!window.location.pathname.includes('admin.html')) {
        return;
    }
    
    initializeAdmin();
    loadAllData();
});

function initializeAdmin() {
    
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(e.target.id);
        });
    });
    
    
    setupModalHandlers();
    
    
    setupFormHandlers();
}

function switchTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const sectionMap = {
        'products-tab': 'products-admin',
        'categories-tab': 'categories-admin',
        'users-tab': 'users-admin',
        'orders-tab': 'orders-admin'
    };
    document.getElementById(sectionMap[tabId]).classList.add('active');
}

function setupModalHandlers() {
    
    
    document.getElementById('add-product-btn').addEventListener('click', () => {
        openProductModal();
    });
    
    
    document.getElementById('add-category-btn').addEventListener('click', () => {
        openCategoryModal();
    });
    
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeModals();
        });
    });
    
    
    document.getElementById('cancel-product-btn').addEventListener('click', closeModals);
    document.getElementById('cancel-category-btn').addEventListener('click', closeModals);
    
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

function setupFormHandlers() {
    
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    
    document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);
}

async function loadAllData() {
    await loadProducts();
    await loadCategories();
    await loadUsers();
    await loadCategoriesForSelects();
    await loadOrders();
}

async function loadProducts() {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/products`);
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/categories`);
        const categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/users`);
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadCategoriesForSelects() {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/categories`);
        const categories = await response.json();
        
        const productCategorySelect = document.getElementById('product-category');
        const categoryParentSelect = document.getElementById('category-parent');
        
        
        productCategorySelect.innerHTML = '';
        categoryParentSelect.innerHTML = '<option value="">None (Top Level)</option>';
        
        categories.forEach(category => {
            const option1 = new Option(category.name, category.id);
            const option2 = new Option(category.name, category.id);
            productCategorySelect.appendChild(option1);
            categoryParentSelect.appendChild(option2);
        });
    } catch (error) {
        console.error('Error loading categories for selects:', error);
    }
}

async function loadOrders() {
    try {
        const [ordersRes, statusesRes, usersRes] = await Promise.all([
            fetch(`${ADMIN_API_BASE_URL}/orders`),
            fetch(`${ADMIN_API_BASE_URL}/statuses`),
            fetch(`${ADMIN_API_BASE_URL}/users`)
        ]);
        const [orders, statuses, users] = await Promise.all([
            ordersRes.json(),
            statusesRes.json(),
            usersRes.json()
        ]);
        displayOrders(orders, statuses, users);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-list');
    
    if (products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${product.name}</h4>
                <p><strong>ID:</strong> ${product.id}</p>
                <p><strong>Description:</strong> ${product.description}</p>
                <p><strong>Category ID:</strong> ${product.categoryId}</p>
                <p><strong>Price:</strong> €${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                <p><strong>Tags:</strong> ${product.tags ? product.tags.join(', ') : 'None'}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-outline" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function displayCategories(categories) {
    const container = document.getElementById('categories-list');
    
    if (categories.length === 0) {
        container.innerHTML = '<p>No categories found.</p>';
        return;
    }
    
    container.innerHTML = categories.map(category => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${category.name}</h4>
                <p><strong>ID:</strong> ${category.id}</p>
                <p><strong>Parent ID:</strong> ${category.parentId || 'None'}</p>
                <p><strong>Created:</strong> ${new Date(category.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary" onclick="editCategory(${category.id})">Edit</button>
                <button class="btn btn-outline" onclick="deleteCategory(${category.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function displayUsers(users) {
    const container = document.getElementById('users-list');
    
    if (users.length === 0) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${user.displayName}</h4>
                <p><strong>ID:</strong> ${user.id}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role ID:</strong> ${user.roleId}</p>
                <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-outline" onclick="deleteUser('${user.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function displayOrders(orders, statuses, users) {
    const container = document.getElementById('orders-list');
    if (!container) return;
    if (!orders.length) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }
    container.innerHTML = orders.map(order => {
        const status = statuses.find(s => s.id === order.statusId)?.name || 'Unknown';
        const user = users.find(u => u.id === order.userId);
        const customer = user ? user.displayName : 'Guest';
        const total = order.total ? order.total.toFixed(2) : '0.00';
        
        return `
            <div class="admin-item">
                <div class="admin-item-info">
                    <p><strong>Order #:</strong> ${order.orderNumber}</p>
                    <p><strong>Customer:</strong> ${customer}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    <p><strong>Status:</strong> ${status}</p>
                    <p><strong>Total:</strong> €${total}</p>
                </div>
            </div>
        `;
    }).join('');
}

function openProductModal(product = null) {
    currentEditingProduct = product;
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (product) {
        title.textContent = 'Edit Product';
        populateProductForm(product);
    } else {
        title.textContent = 'Add Product';
        form.reset();
    }
    
    modal.style.display = 'block';
}

function openCategoryModal(category = null) {
    currentEditingCategory = category;
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    
    if (category) {
        title.textContent = 'Edit Category';
        populateCategoryForm(category);
    } else {
        title.textContent = 'Add Category';
        form.reset();
    }
    
    modal.style.display = 'block';
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    currentEditingProduct = null;
    currentEditingCategory = null;
}

function populateProductForm(product) {
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-category').value = product.categoryId;
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-tags').value = product.tags ? product.tags.join(', ') : '';
    document.getElementById('product-images').value = product.images ? product.images.join(', ') : '';
}

function populateCategoryForm(category) {
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-parent').value = category.parentId || '';
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const product = {
        id: formData.get('id'),
        name: formData.get('name'),
        description: formData.get('description'),
        categoryId: parseInt(formData.get('categoryId')),
        price: parseFloat(formData.get('price')),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
        images: formData.get('images') ? formData.get('images').split(',').map(img => img.trim()) : [],
        createdAt: currentEditingProduct ? currentEditingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
    };
    
    try {
        let response;
        if (currentEditingProduct) {
            response = await fetch(`${ADMIN_API_BASE_URL}/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });
        } else {
            response = await fetch(`${ADMIN_API_BASE_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });
        }
        
        if (response.ok) {
            closeModals();
            await loadProducts();
            alert(currentEditingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        } else {
            throw new Error('Failed to save product');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product. Please try again.');
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const category = {
        name: formData.get('name'),
        parentId: formData.get('parentId') ? parseInt(formData.get('parentId')) : null,
        createdAt: currentEditingCategory ? currentEditingCategory.createdAt : new Date().toISOString()
    };
    
    if (currentEditingCategory) {
        category.id = currentEditingCategory.id;
    }
    
    try {
        let response;
        if (currentEditingCategory) {
            response = await fetch(`${ADMIN_API_BASE_URL}/categories/${category.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(category)
            });
        } else {
            response = await fetch(`${ADMIN_API_BASE_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(category)
            });
        }
        
        if (response.ok) {
            closeModals();
            await loadCategories();
            await loadCategoriesForSelects();
            alert(currentEditingCategory ? 'Category updated successfully!' : 'Category created successfully!');
        } else {
            throw new Error('Failed to save category');
        }
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Error saving category. Please try again.');
    }
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/products/${productId}`);
        const product = await response.json();
        openProductModal(product);
    } catch (error) {
        console.error('Error loading product for editing:', error);
        alert('Error loading product. Please try again.');
    }
}

async function editCategory(categoryId) {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/categories/${categoryId}`);
        const category = await response.json();
        openCategoryModal(category);
    } catch (error) {
        console.error('Error loading category for editing:', error);
        alert('Error loading category. Please try again.');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadProducts();
            alert('Product deleted successfully!');
        } else {
            throw new Error('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) {
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadCategories();
            await loadCategoriesForSelects();
            alert('Category deleted successfully!');
        } else {
            throw new Error('Failed to delete category');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadUsers();
            alert('User deleted successfully!');
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
    }
}
