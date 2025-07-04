document.addEventListener('DOMContentLoaded', loadOrders);

async function loadOrders() {
  const orders = await apiFetch('/orders?userId=usr_cloud');
  const list = document.getElementById('order-history');
  list.innerHTML = '';
  for (const order of orders) {
    const li = document.createElement('li');
    const total = (order.totals?.grandTotalCents || 0) / 100;
    li.textContent = `${order.orderNumber} - ${total} EUR`;
    list.appendChild(li);
  }
}

