const API_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const email = formData.get('email');
      const password = formData.get('password');
      try {
        const res = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
        const users = await res.json();
        if (users.length) {
          const user = users[0];
          localStorage.setItem('userId', user.id);
          window.location.href = 'index.html';
        } else {
          alert('Invalid credentials');
        }
      } catch (err) {
        console.error(err);
        alert('Login failed');
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const displayName = formData.get('displayName');
      const email = formData.get('email');
      const password = formData.get('password');
      const id = 'usr_' + Math.random().toString(36).substring(2, 10);
      try {
        const gifRes = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${encodeURIComponent(displayName)}`);
        const gifData = await gifRes.json();
        const image = gifData.data?.images?.downsized_medium?.url || '';
        const user = {
          id,
          displayName,
          email,
          password,
          profileImage: image,
          roleId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null
        };
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        if (res.ok) {
          localStorage.setItem('userId', id);
          window.location.href = 'index.html';
        } else {
          alert('Registration failed');
        }
      } catch (err) {
        console.error(err);
        alert('Registration failed');
      }
    });
  }

  const profileContainer = document.getElementById('profileContainer');
  if (profileContainer) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      window.location.href = 'login.html';
      return;
    }
    loadProfile(userId);
  }
});

async function loadProfile(userId) {
  try {
    const [userRes, addrRes, ordersRes] = await Promise.all([
      fetch(`${API_URL}/users/${userId}`),
      fetch(`${API_URL}/addresses?userId=${userId}`),
      fetch(`${API_URL}/orders?userId=${userId}`)
    ]);
    const user = await userRes.json();
    const addresses = await addrRes.json();
    const orders = await ordersRes.json();
    const container = document.getElementById('profileContainer');
    container.innerHTML = `
      <img src="${user.profileImage || ''}" alt="Profile Image" width="200">
      <h2>${user.displayName}</h2>
      <p>Email: ${user.email}</p>
      <h3>Addresses</h3>
      <ul>${addresses.map(a => `<li>${a.street}, ${a.city}, ${a.country}</li>`).join('')}</ul>
      <h3>Orders</h3>
      <ul>${orders.map(o => `<li>${o.orderNumber}</li>`).join('')}</ul>
    `;
  } catch (err) {
    console.error(err);
    const container = document.getElementById('profileContainer');
    if (container) container.textContent = 'Failed to load profile';
  }
}
