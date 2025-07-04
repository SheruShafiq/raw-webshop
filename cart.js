document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  document.getElementById('checkout-btn').addEventListener('click', checkout);
});

async function loadCart() {
  const cart = await apiFetch('/carts/cart_cloud');
  const list = document.getElementById('cart-items');
  list.innerHTML = '';
  let subtotal = 0;
  for (const item of cart.items) {
    const product = await apiFetch(`/products/${item.productId}`);
    const variant = product.variants.find(v => v.id === item.variantId) || {};
    const lineTotal = (variant.priceCents || 0) * item.quantity;
    const li = document.createElement('li');
    li.textContent = `${product.name} (${variant.name}) x${item.quantity} - ${lineTotal / 100} EUR`;
    list.appendChild(li);
    subtotal += lineTotal;
  }
  document.getElementById('cart-total').textContent = `Total: ${subtotal / 100} EUR`;
}

async function checkout() {
  const cart = await apiFetch('/carts/cart_cloud');
  if (!cart.items.length) {
    alert('Cart is empty');
    return;
  }

  let subtotal = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = await apiFetch(`/products/${item.productId}`);
    const variant = product.variants.find(v => v.id === item.variantId) || {};
    const unitPrice = variant.priceCents || 0;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    orderItems.push({
      orderId: '',
      productId: item.productId,
      variantId: item.variantId,
      unitPriceCents: unitPrice,
      quantity: item.quantity,
      subtotalCents: lineTotal
    });
    const inv = await apiFetch(`/inventory?productId=${item.productId}&variantId=${item.variantId}`);
    if (inv[0]) {
      await apiFetch(`/inventory/${inv[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: inv[0].stock - item.quantity,
          updatedAt: new Date().toISOString()
        })
      });
    }
  }

  const orderId = `ord_${Date.now()}`;
  orderItems.forEach(oi => oi.orderId = orderId);

  const order = {
    id: orderId,
    orderNumber: orderId,
    userId: cart.userId,
    statusId: 1,
    currency: 'EUR',
    shippingAddressId: 'addr_7th_heaven',
    billingAddressId: 'addr_shinra',
    couponId: null,
    totals: {
      subtotalCents: subtotal,
      discountCents: 0,
      taxCents: 0,
      shippingCents: 0,
      grandTotalCents: subtotal
    },
    Items: orderItems,
    createdAt: new Date().toISOString(),
    updatedAt: null
  };

  await apiFetch('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });

  await apiFetch(`/carts/${cart.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [] })
  });

  window.location.href = 'profile.html';
}

