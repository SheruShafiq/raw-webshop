document.addEventListener('DOMContentLoaded', () => {
    const listEl = document.getElementById('product-list');
    if (!listEl) return;

    fetch('http://localhost:3001/products')
        .then(res => res.json())
        .then(products => {
            products.forEach(p => {
                const item = document.createElement('div');
                item.className = 'product-item';
                const link = document.createElement('a');
                link.href = `product.html?id=${encodeURIComponent(p.id)}`;
                link.textContent = p.name;
                item.appendChild(link);
                listEl.appendChild(item);
            });
        })
        .catch(() => {
            listEl.textContent = 'Failed to load products';
        });
});
