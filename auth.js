// Authentication system for Wall Market Online
const AUTH_API_BASE_URL = 'http://localhost:3001';

// Current user state
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize authentication
    initializeAuth();
    
    // Check if user is logged in
    checkUserSession();
    
    // Setup auth event listeners
    setupAuthEventListeners();
    
    // Update navigation based on user state
    updateNavigation();
});

function initializeAuth() {
    // Load user from localStorage if exists
    const storedUser = localStorage.getItem('wallMarketUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log('Loaded user from storage:', currentUser);
    }
}

function setupAuthEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Profile link
    document.addEventListener('click', (e) => {
        if (e.target.id === 'profile-link') {
            e.preventDefault();
            window.location.href = getPagePath('profile.html');
        }
        
        if (e.target.id === 'admin-link') {
            e.preventDefault();
            window.location.href = getPagePath('admin.html');
        }
        
        if (e.target.id === 'login-link') {
            e.preventDefault();
            window.location.href = getPagePath('login.html');
        }
    });
}

function getPagePath(page) {
    const currentPath = window.location.pathname;
    const isInSubfolder = currentPath.includes('/pages/');
    
    if (isInSubfolder) {
        return page;
    } else {
        return `pages/${page}`;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        // Fetch users to find matching email and password
        const response = await fetch(`${AUTH_API_BASE_URL}/users`);
        const users = await response.json();
        
        const user = users.find(u => u.email === email && u.password === password && !u.deletedAt);
        
        if (user) {
            // Fetch user role
            const roleResponse = await fetch(`${AUTH_API_BASE_URL}/roles/${user.roleId}`);
            const role = await roleResponse.json();
            
            // Store user with role information
            currentUser = {
                ...user,
                role: role
            };
            
            localStorage.setItem('wallMarketUser', JSON.stringify(currentUser));
            
            showAuthMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to home page after short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            
        } else {
            showAuthMessage('Invalid email or password.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const displayName = formData.get('displayName');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match.', 'error');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    try {
        // Check if email already exists
        const response = await fetch(`${AUTH_API_BASE_URL}/users`);
        const users = await response.json();
        
        if (users.find(u => u.email === email && !u.deletedAt)) {
            showAuthMessage('An account with this email already exists.', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            id: `USER_${Date.now()}`,
            displayName: displayName,
            email: email,
            password: password, // In production, this should be hashed
            roleId: 1, // Default to User role
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null
        };
        
        const createResponse = await fetch(`${AUTH_API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        
        if (createResponse.ok) {
            showAuthMessage('Account created successfully! You can now login.', 'success');
            showLoginForm();
        } else {
            throw new Error('Failed to create account');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showAuthMessage('Registration failed. Please try again.', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('wallMarketUser');
    
    // Redirect to home page
    window.location.href = '../index.html';
}

function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        clearAuthMessage();
    }
}

function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        clearAuthMessage();
    }
}

function showAuthMessage(message, type) {
    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        messageEl.style.display = 'block';
    }
}

function clearAuthMessage() {
    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
        messageEl.style.display = 'none';
        messageEl.textContent = '';
        messageEl.className = 'auth-message';
    }
}

function updateNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    // Remove existing auth links
    const existingAuthLinks = nav.querySelectorAll('.auth-link');
    existingAuthLinks.forEach(link => link.remove());
    
    if (currentUser) {
        // User is logged in
        const profileLink = document.createElement('a');
        profileLink.href = '#';
        profileLink.id = 'profile-link';
        profileLink.className = 'auth-link';
        profileLink.textContent = `Welcome, ${currentUser.displayName}`;
        nav.appendChild(profileLink);
        
        // Show admin link if user is admin
        if (currentUser.role && currentUser.role.name === 'Admin') {
            const adminLink = document.createElement('a');
            adminLink.href = '#';
            adminLink.id = 'admin-link';
            adminLink.className = 'auth-link';
            adminLink.textContent = 'Admin Panel';
            nav.appendChild(adminLink);
        }
        
    } else {
        // User is not logged in
        const loginLink = document.createElement('a');
        loginLink.href = '#';
        loginLink.id = 'login-link';
        loginLink.className = 'auth-link';
        loginLink.textContent = 'Login';
        nav.appendChild(loginLink);
    }
}

function checkUserSession() {
    // Update navigation and load profile if on profile page
    updateNavigation();
    
    if (window.location.pathname.includes('profile.html')) {
        loadUserProfile();
    }
    
    // Redirect to login if trying to access protected pages
    if (window.location.pathname.includes('admin.html') && (!currentUser || currentUser.role.name !== 'Admin')) {
        alert('Access denied. Admin privileges required.');
        window.location.href = getPagePath('login.html');
    }
}

async function loadUserProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent || !currentUser) return;
    
    try {
        // Fetch user profile data
        const profileResponse = await fetch(`${AUTH_API_BASE_URL}/userProfiles?userId=${currentUser.id}`);
        const profiles = await profileResponse.json();
        const profile = profiles[0];
        
        profileContent.innerHTML = `
            <div class="profile-info">
                <h3>Account Information</h3>
                <div class="profile-field">
                    <strong>Display Name:</strong> ${currentUser.displayName}
                </div>
                <div class="profile-field">
                    <strong>Email:</strong> ${currentUser.email}
                </div>
                <div class="profile-field">
                    <strong>Role:</strong> ${currentUser.role ? currentUser.role.name : 'User'}
                </div>
                <div class="profile-field">
                    <strong>Member Since:</strong> ${new Date(currentUser.createdAt).toLocaleDateString()}
                </div>
                ${profile ? `
                    <div class="profile-field">
                        <strong>Phone:</strong> ${profile.phone || 'Not provided'}
                    </div>
                    <div class="profile-field">
                        <strong>Date of Birth:</strong> ${profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error('Error loading profile:', error);
        profileContent.innerHTML = '<p>Error loading profile information.</p>';
    }
}

// Utility functions
function isLoggedIn() {
    return currentUser !== null;
}

function isAdmin() {
    return currentUser && currentUser.role && currentUser.role.name === 'Admin';
}

function getCurrentUser() {
    return currentUser;
}

// Export functions for use in other scripts
window.authSystem = {
    isLoggedIn,
    isAdmin,
    getCurrentUser,
    updateNavigation
};
