const API_URL = 'http://localhost:3001';

function requireAdmin() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
        alert('Access denied.');
        window.location.href = 'index.html';
        return false;
    }
    try {
        const user = JSON.parse(userJson);
        if (user.roleId !== 2) {
            alert('Access denied.');
            window.location.href = 'index.html';
            return false;
        }
    } catch (err) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAdmin()) return;
    loadProducts();
    loadCategories();
    loadUsers();

    document.getElementById('add-product-form').addEventListener('submit', addProduct);
    document.getElementById('add-category-form').addEventListener('submit', addCategory);
    document.getElementById('add-user-form').addEventListener('submit', addUser);
});

async function loadProducts() {
    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.id}</td><td>${p.name}</td><td>${p.categoryId}</td>` +
            `<td><button data-id="${p.id}" class="edit-product">Edit</button>` +
            ` <button data-id="${p.id}" class="delete-product">Delete</button></td>`;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.edit-product').forEach(btn => btn.addEventListener('click', () => editProduct(btn.dataset.id)));
    tbody.querySelectorAll('.delete-product').forEach(btn => btn.addEventListener('click', () => deleteProduct(btn.dataset.id)));
}

async function addProduct(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    data.categoryId = Number(data.categoryId);
    await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    form.reset();
    loadProducts();
}

async function editProduct(id) {
    const res = await fetch(`${API_URL}/products/${id}`);
    const product = await res.json();
    const name = prompt('Product name:', product.name);
    const categoryId = prompt('Category ID:', product.categoryId);
    if (!name) return;
    product.name = name;
    product.categoryId = Number(categoryId);
    await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(product)
    });
    loadProducts();
}

async function deleteProduct(id) {
    if (!confirm('Delete product?')) return;
    await fetch(`${API_URL}/products/${id}`, {method: 'DELETE'});
    loadProducts();
}

async function loadCategories() {
    const res = await fetch(`${API_URL}/categories`);
    const cats = await res.json();
    const tbody = document.querySelector('#categories-table tbody');
    tbody.innerHTML = '';
    cats.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.id}</td><td>${c.name}</td>` +
            `<td><button data-id="${c.id}" class="edit-category">Edit</button>` +
            ` <button data-id="${c.id}" class="delete-category">Delete</button></td>`;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.edit-category').forEach(btn => btn.addEventListener('click', () => editCategory(btn.dataset.id)));
    tbody.querySelectorAll('.delete-category').forEach(btn => btn.addEventListener('click', () => deleteCategory(btn.dataset.id)));
}

async function addCategory(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    form.reset();
    loadCategories();
}

async function editCategory(id) {
    const res = await fetch(`${API_URL}/categories/${id}`);
    const cat = await res.json();
    const name = prompt('Category name:', cat.name);
    if (!name) return;
    cat.name = name;
    await fetch(`${API_URL}/categories/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(cat)
    });
    loadCategories();
}

async function deleteCategory(id) {
    if (!confirm('Delete category?')) return;
    await fetch(`${API_URL}/categories/${id}`, {method: 'DELETE'});
    loadCategories();
}

async function loadUsers() {
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${u.id}</td><td>${u.displayName}</td><td>${u.email}</td><td>${u.roleId}</td>` +
            `<td><button data-id="${u.id}" class="edit-user">Edit</button>` +
            ` <button data-id="${u.id}" class="delete-user">Delete</button></td>`;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.edit-user').forEach(btn => btn.addEventListener('click', () => editUser(btn.dataset.id)));
    tbody.querySelectorAll('.delete-user').forEach(btn => btn.addEventListener('click', () => deleteUser(btn.dataset.id)));
}

async function addUser(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    data.roleId = Number(data.roleId);
    await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    form.reset();
    loadUsers();
}

async function editUser(id) {
    const res = await fetch(`${API_URL}/users/${id}`);
    const user = await res.json();
    const displayName = prompt('Display name:', user.displayName);
    const email = prompt('Email:', user.email);
    const roleId = prompt('Role ID:', user.roleId);
    if (!displayName || !email) return;
    user.displayName = displayName;
    user.email = email;
    user.roleId = Number(roleId);
    await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(user)
    });
    loadUsers();
}

async function deleteUser(id) {
    if (!confirm('Delete user?')) return;
    await fetch(`${API_URL}/users/${id}`, {method: 'DELETE'});
    loadUsers();
}
