async function fetchProducts() {
  try {
    const response = await fetch('http://localhost:3001/products');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch products', err);
    return [];
  }
}

function renderProducts(products) {
  const container = document.getElementById('productContainer');
  container.innerHTML = '';

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const title = document.createElement('h2');
    title.textContent = product.name;

    const desc = document.createElement('p');
    desc.textContent = product.description;

    card.appendChild(title);
    card.appendChild(desc);
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchInput');
  let products = await fetchProducts();
  renderProducts(products);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter((p) => {
      return (
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    });
    renderProducts(filtered);
  });
});

