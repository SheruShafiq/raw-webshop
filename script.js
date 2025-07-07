const API_BASE_URL = "/api";

function waitForAuth() {
  return new Promise((resolve) => {
    if (typeof window.authSystem === "undefined") {
      const checkAuth = setInterval(() => {
        if (typeof window.authSystem !== "undefined") {
          clearInterval(checkAuth);
          resolve();
        }
      }, 50);
    } else {
      resolve();
    }
  });
}

function getPagePath(page) {
  const path = window.location.pathname;
  const base = path.includes("/pages/")
    ? path.substring(0, path.indexOf("/pages/"))
    : path.substring(0, path.lastIndexOf("/"));
  return `${base}/pages/${page}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  await waitForAuth();

  const currentPage = window.location.pathname;

  await initializeCart();
  updateCartUI();

  initializeAudioToggle();

  const cartLink = document.getElementById("cart-link");
  if (cartLink) {
    cartLink.addEventListener("click", (e) => {
      e.preventDefault();
      playFF7Sound("menu_select");
      showPageTransition("Accessing Cart...");
      setTimeout(() => {
        window.location.href = getPagePath("cart.html");
      }, 500);
    });
  }

  if (
    currentPage.includes("product.html") ||
    currentPage.endsWith("/product.html")
  ) {
    loadProductDetail();
  } else if (
    currentPage.includes("index.html") ||
    currentPage === "/" ||
    currentPage.endsWith("/")
  ) {
    loadProducts();
  } else if (currentPage.includes("cart.html")) {
    await initializeCart();
    loadCartPage();
  }
});

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function fetchProduct(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product. Status: ${response.status}`);
    }
    const product = await response.json();
    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

function createProductCard(product) {
  const price = product.price.toFixed(2);
  const cardClass = getProductCardClass(product);

  const shortDescription =
    product.description.length > 100
      ? product.description.substring(0, 100) + "..."
      : product.description;

  
  const imageCarousel = createProductCardImageCarousel(product.images, product.name, product.id);

  return `
        <div class="product-card ${cardClass} ff7-menu-item" data-product-id="${product.id}">
            ${imageCarousel}
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${shortDescription}</p>
                <div class="product-price">${price}</div>
                <div class="product-actions">
                    <button class="btn btn-primary view-details-btn" data-product-id="${product.id}">View Details</button>
                    <button class="btn btn-secondary add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

function createProductCardImageCarousel(images, productName, productId) {
  if (!images || images.length === 0) {
    return `<div class="product-image-container">
              <img src="https://via.placeholder.com/300x200?text=No+Image" alt="No Image" class="product-image">
            </div>`;
  }

  if (images.length === 1) {
    const imageSrc = images[0];
    return `<div class="product-image-container">
              <img src="${imageSrc}" alt="${productName}" class="product-image">
            </div>`;
  }

  
  const imagesHtml = images.map((image, index) => {
    const imageSrc = image;
    return `<img src="${imageSrc}" alt="${productName} ${index + 1}" class="product-image ${index === 0 ? 'active' : ''}" data-index="${index}">`;
  }).join('');

  const indicatorsHtml = images.map((_, index) => {
    return `<button class="carousel-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`;
  }).join('');

  return `<div class="product-image-container" data-product-id="${productId}">
            <div class="product-image-carousel">
              ${imagesHtml}
              ${images.length > 1 ? `
                <button class="carousel-btn carousel-prev" aria-label="Previous image">‹</button>
                <button class="carousel-btn carousel-next" aria-label="Next image">›</button>
              ` : ''}
            </div>
            ${images.length > 1 ? `
              <div class="carousel-indicators">
                ${indicatorsHtml}
              </div>
            ` : ''}
          </div>`;
}

async function loadProducts() {
  const products = await fetchProducts();
  const container = document.getElementById("products-container");

  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = "<p>No equipment available.</p>";
    return;
  }

  displayProducts(products);
  setupProductSearch(products);
}

function displayProducts(products) {
  const container = document.getElementById("products-container");
  container.innerHTML = products
    .map((product) => createProductCard(product))
    .join("");

  
  setupProductCardCarousels();

  document.querySelectorAll(".view-details-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      playFF7Sound("menu_select");
      const productId = e.target.getAttribute("data-product-id");
      showPageTransition("Loading Item Details...");
      setTimeout(() => {
        viewProduct(productId);
      }, 500);
    });
  });

  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      playFF7Sound("menu_cursor");
      const productId = e.target.getAttribute("data-product-id");

      const originalText = e.target.textContent;
      e.target.textContent = "Adding...";
      e.target.disabled = true;

      const success = await addToCart(productId);

      setTimeout(() => {
        e.target.textContent = originalText;
        e.target.disabled = false;
      }, 1000);
    });
  });
}

function setupProductSearch(products) {
  const searchInput = document.getElementById("product-search");
  if (!searchInput) return;

  let typingTimeout;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(typingTimeout);
    playFF7Sound("typing");

    const searchTerm = e.target.value.toLowerCase();

    if (searchTerm === "") {
      displayProducts(products);
      return;
    }

    typingTimeout = setTimeout(() => {
      const filteredProducts = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
      );

      displayProducts(filteredProducts);

      if (filteredProducts.length === 0) {
        document.getElementById("products-container").innerHTML =
          '<div class="ff7-window" style="padding: 2rem; text-align: center;"><p>No items found matching your search.</p></div>';
      }
    }, 300);
  });

  searchInput.addEventListener("focus", () => {
    playFF7Sound("menu_select");
  });
}

function viewProduct(productId) {
  const baseUrl =
    window.location.origin + window.location.pathname.replace("index.html", "");
  const targetUrl = `${baseUrl}pages/product.html?id=${productId}`;
  window.location.href = targetUrl;
}

async function loadProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  const container = document.getElementById("product-detail-container");

  if (!container) {
    console.error("Product detail container not found!");
    return;
  }

  if (!productId) {
    console.error("No product ID found in URL");
    container.innerHTML =
      '<p>Product ID not found in URL. Please select a product from the <a href="../index.html">home page</a>.</p>';
    return;
  }

  container.innerHTML = "<p>Loading product details...</p>";

  try {
    const product = await fetchProduct(productId);

    if (!product) {
      console.error("Product not found for ID:", productId);
      container.innerHTML =
        '<p>Product not found. Please select a product from the <a href="../index.html">home page</a>.</p>';
      return;
    }

    container.innerHTML = createProductDetail(product);

    
    setupProductDetailImageViewer();

    document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        const productId = e.target.getAttribute("data-product-id");
        await addToCart(productId);
      });
    });
  } catch (error) {
    console.error("Error loading product detail:", error);
    container.innerHTML =
      "<p>Error loading product details. Please try again. Error: " +
      error.message +
      "</p>";
  }
}

function createProductDetail(product) {
  const price = product.price.toFixed(0);
  const cardClass = getProductCardClass(product);

  
  const imageViewer = createProductDetailImageViewer(product.images, product.name);

  const tags =
    product.tags && product.tags.length > 0
      ? product.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")
      : '<span class="tag">No tags</span>';

  const categoryName = getCategoryName(product.categoryId);

  return `
        <div class="product-detail ${cardClass}">
            ${imageViewer}
            <div class="product-info">
                <h1>${product.name}</h1>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <p><strong>Category:</strong> ${categoryName}</p>
                    <p><strong>Item ID:</strong> ${product.id}</p>
                    <p><strong>Added:</strong> ${new Date(
                      product.createdAt
                    ).toLocaleDateString()}</p>
                </div>
                <div class="product-tags">
                    <h4>Attributes:</h4>
                    ${tags}
                </div>
                <div class="product-price-display">
                    <h3>Price: <span class="ff7-counter gil">${price} Gil ◆</span></h3>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-btn" data-product-id="${
                      product.id
                    }">Obtain Item</button>
                    <button onclick="window.history.back()" class="btn btn-outline">◀ Return</button>
                </div>
            </div>
        </div>
    `;
}

function createProductDetailImageViewer(images, productName) {
  if (!images || images.length === 0) {
    return `<div class="product-images">
              <div class="main-image-container">
                <img src="https://via.placeholder.com/400x300?text=No+Image" alt="No Image" class="product-detail-image">
              </div>
            </div>`;
  }

  
  const adjustedImages = images.map(image => {
    return image.startsWith("assets/") && window.location.pathname.includes("/pages/")
      ? `../${image}`
      : image;
  });

  if (adjustedImages.length === 1) {
    return `<div class="product-images">
              <div class="main-image-container">
                <img src="${adjustedImages[0]}" alt="${productName}" class="product-detail-image">
              </div>
            </div>`;
  }

  
  const mainImageHtml = `<img src="${adjustedImages[0]}" alt="${productName}" class="product-detail-image main-image" data-index="0">`;
  
  const thumbnailsHtml = adjustedImages.map((image, index) => {
    return `<img src="${image}" alt="${productName} ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">`;
  }).join('');

  return `<div class="product-images">
            <div class="main-image-container">
              ${mainImageHtml}
              ${adjustedImages.length > 1 ? `
                <button class="image-nav-btn image-prev" aria-label="Previous image">‹</button>
                <button class="image-nav-btn image-next" aria-label="Next image">›</button>
              ` : ''}
            </div>
            ${adjustedImages.length > 1 ? `
              <div class="thumbnail-container">
                ${thumbnailsHtml}
              </div>
            ` : ''}
          </div>`;
}

function getCategoryName(categoryId) {
  const categories = {
    1: "Weapons",
    2: "Materia",
    3: "Items",
    4: "Swords",
  };
  return categories[categoryId] || "Unknown";
}

let currentCart = null;

async function initializeCart() {
  if (window.currentUser) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/carts?userId=${window.currentUser.id}`
      );
      const carts = await response.json();
      currentCart =
        carts.find((cart) => cart.userId === window.currentUser.id) || null;
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  } else {
    const guestCart = localStorage.getItem("guestCart");
    if (guestCart) {
      currentCart = JSON.parse(guestCart);
    } else {
      currentCart = {
        id: `guest_cart_${Date.now()}`,
        userId: null,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem("guestCart", JSON.stringify(currentCart));
    }
  }
  updateCartUI();
}

async function addToCart(productId, quantity = 1) {
  try {
    if (currentCart === null) {
      await initializeCart();
    }

    if (window.currentUser) {
      await addToUserCart(productId, quantity);
    } else {
      addToGuestCart(productId, quantity);
    }

    showMessage("Item obtained!", "success");
    updateCartUI();

    if (window.location.pathname.includes("cart.html")) {
      loadCartPage();
    }

    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    showMessage("Failed to obtain item. Try again.", "error");
    return false;
  }
}

async function addToUserCart(productId, quantity) {
  if (!currentCart) {
    const newCart = {
      id: `cart_${window.currentUser.id}_${Date.now()}`,
      userId: window.currentUser.id,
      items: [
        {
          productId: productId,
          quantity: quantity,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const response = await fetch(`${API_BASE_URL}/carts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCart),
    });

    if (response.ok) {
      currentCart = newCart;
    }
  } else {
    const existingItem = currentCart.items.find(
      (item) => item.productId === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentCart.items.push({
        productId: productId,
        quantity: quantity,
      });
    }

    currentCart.updatedAt = new Date().toISOString();

    const response = await fetch(`${API_BASE_URL}/carts/${currentCart.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentCart),
    });
  }
}

function addToGuestCart(productId, quantity) {
  if (!currentCart) {
    currentCart = {
      id: `guest_cart_${Date.now()}`,
      userId: null,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  const existingItem = currentCart.items.find(
    (item) => item.productId === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    currentCart.items.push({
      productId: productId,
      quantity: quantity,
    });
  }

  currentCart.updatedAt = new Date().toISOString();
  localStorage.setItem("guestCart", JSON.stringify(currentCart));
}

async function removeFromCart(productId) {
  if (!currentCart) return;

  currentCart.items = currentCart.items.filter(
    (item) => item.productId !== productId
  );

  try {
    if (window.currentUser) {
      await fetch(`${API_BASE_URL}/carts/${currentCart.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentCart),
      });
    } else {
      localStorage.setItem("guestCart", JSON.stringify(currentCart));
    }

    updateCartUI();
    showMessage("Item removed from inventory", "success");
  } catch (error) {
    console.error("Error removing from cart:", error);
    showMessage("Failed to remove item", "error");
  }
}

async function updateCartItemQuantity(productId, newQuantity) {
  if (!currentCart) return;

  const item = currentCart.items.find((item) => item.productId === productId);

  if (item) {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    item.quantity = newQuantity;
    currentCart.updatedAt = new Date().toISOString();

    try {
      if (window.currentUser) {
        await fetch(`${API_BASE_URL}/carts/${currentCart.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentCart),
        });
      } else {
        localStorage.setItem("guestCart", JSON.stringify(currentCart));
      }

      updateCartUI();
    } catch (error) {
      console.error("Error updating cart:", error);
      showMessage("Failed to update cart", "error");
    }
  }
}

function updateCartUI() {
  const cartLink = document.getElementById("cart-link");
  if (cartLink && currentCart) {
    const itemCount = currentCart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const existingBadge = cartLink.querySelector(".cart-badge");
    if (existingBadge) {
      existingBadge.remove();
    }

    if (itemCount > 0) {
      const badge = document.createElement("span");
      badge.className = "cart-badge";
      badge.textContent = itemCount;
      cartLink.appendChild(badge);
      cartLink.innerHTML = `Cart ${badge.outerHTML}`;
    } else {
      cartLink.textContent = "Cart";
    }
  }
}

async function createOrder(orderData) {
  try {
    const order = {
      id: `ord_${Date.now()}`,
      orderNumber: `2025-${String(Date.now()).slice(-6)}`,
      userId: window.currentUser ? window.currentUser.id : null,
      statusId: 1,
      currency: "EUR",
      total: orderData.total,
      items: orderData.items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (response.ok) {
      await clearCart();
      return order;
    } else {
      throw new Error("Failed to create order");
    }
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

async function getUserOrders(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders?userId=${userId}`);
    if (response.ok) {
      const orders = await response.json();
      return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      throw new Error("Failed to fetch orders");
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

async function getOrderStatus(statusId) {
  try {
    const response = await fetch(`${API_BASE_URL}/statuses/${statusId}`);
    if (response.ok) {
      const status = await response.json();
      return status.name;
    } else {
      return "Unknown";
    }
  } catch (error) {
    console.error("Error fetching status:", error);
    return "Unknown";
  }
}

async function getProductDetails(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    if (response.ok) {
      return await response.json();
    } else {
      return { name: "Unknown Product", price: 0 };
    }
  } catch (error) {
    console.error("Error fetching product details:", error);
    return { name: "Unknown Product", price: 0 };
  }
}

async function clearCart() {
  if (!currentCart) return;

  try {
    if (window.currentUser) {
      await fetch(`${API_BASE_URL}/carts/${currentCart.id}`, {
        method: "DELETE",
      });
    } else {
      localStorage.removeItem("guestCart");
    }

    currentCart = null;
    updateCartUI();
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
}

async function loadCartPage() {
  const container = document.getElementById("cart-container");
  if (!container) {
    console.error("Cart container not found!");
    return;
  }

  if (!currentCart) {
    await initializeCart();
  }

  if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
    container.innerHTML = `
            <div class="ff7-window">
                <p style="padding: 2rem; text-align: center;">Your inventory is empty.</p>
                <div class="cart-actions" style="text-align: center; padding-bottom: 2rem;">
                    <a href="../index.html" class="btn btn-primary">Browse Equipment</a>
                </div>
            </div>
        `;
    return;
  }

  try {
    let itemsHtml = "";
    let subtotal = 0;

    for (const item of currentCart.items) {
      const product = await fetchProduct(item.productId);

      if (!product) {
        console.error("Product not found for ID:", item.productId);
        continue;
      }

      const unitPrice = product.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      itemsHtml += `
                <tr data-product-id="${item.productId}">
                    <td>${product.name}</td>
                    <td><span class="ff7-counter gil">${unitPrice.toFixed(
                      0
                    )} Gil</span></td>
                    <td>
                        <div class="quantity-control">
                            <button class="quantity-btn decrease-btn">-</button>
                            <input type="number" class="quantity-input" value="${
                              item.quantity
                            }" min="1" max="99">
                            <button class="quantity-btn increase-btn">+</button>
                        </div>
                    </td>
                    <td><span class="ff7-counter gil">${lineTotal.toFixed(
                      0
                    )} Gil</span></td>
                    <td>
                        <button class="btn btn-outline remove-item-btn">Remove</button>
                    </td>
                </tr>`;
    }

    const grandTotal = subtotal;

    container.innerHTML = `
            <div class="ff7-window">
                <table class="cart-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Unit Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div class="cart-summary">
                    <p><strong>Total Gil: <span class="ff7-counter gil">${grandTotal.toFixed(
                      0
                    )} ◆</span></strong></p>
                    <div class="cart-actions">
                        <button id="clear-cart-btn" class="btn btn-outline">Clear All</button>
                        <button id="checkout-btn" class="btn btn-primary">Purchase</button>
                    </div>
                </div>
            </div>
        `;

    setupCartEventListeners();
  } catch (error) {
    console.error("Error loading cart page:", error);
    container.innerHTML = `<p>Error loading inventory: ${error.message}</p>`;
  }
}

function setupCartEventListeners() {
  document
    .querySelectorAll(".quantity-control .quantity-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        playFF7Sound("menu_cursor");
        const row = e.target.closest("tr");
        const productId = row.dataset.productId;
        const input = row.querySelector(".quantity-input");
        let currentQty = parseInt(input.value, 10);

        if (e.target.classList.contains("decrease-btn")) {
          currentQty = Math.max(1, currentQty - 1);
        } else if (e.target.classList.contains("increase-btn")) {
          currentQty = Math.min(99, currentQty + 1);
        }

        input.value = currentQty;
        updateCartItemQuantity(productId, currentQty);
      });
    });

  document.querySelectorAll(".quantity-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      playFF7Sound("menu_cursor");
      const row = e.target.closest("tr");
      const productId = row.dataset.productId;
      let newQty = parseInt(e.target.value, 10);

      if (isNaN(newQty) || newQty < 1) {
        newQty = 1;
        e.target.value = 1;
      } else if (newQty > 99) {
        newQty = 99;
        e.target.value = 99;
      }

      updateCartItemQuantity(productId, newQty);
    });
  });

  document.querySelectorAll(".remove-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      playFF7Sound("menu_cancel");
      const row = e.target.closest("tr");
      const productId = row.dataset.productId;

      if (confirm("Remove this item from your inventory?")) {
        removeFromCart(productId).then(() => {
          loadCartPage();
        });
      }
    });
  });

  const clearCartBtn = document.getElementById("clear-cart-btn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", async () => {
      playFF7Sound("menu_cancel");
      if (confirm("Clear all items from inventory?")) {
        showPageTransition("Clearing Inventory...");
        await clearCart();
        setTimeout(() => {
          loadCartPage();
        }, 800);
      }
    });
  }

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", (e) => {
      playFF7Sound("menu_select");
      handleCheckout();
    });
  }
}

async function handleCheckout() {
  try {
    if (!window.currentUser) {
      showMessage("Please access the member terminal first.", "error");
      setTimeout(
        () => (window.location.href = getPagePath("login.html")),
        1500
      );
      return;
    }

    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.textContent = "Processing...";
      checkoutBtn.disabled = true;
    }

    const detailedItems = await Promise.all(
      currentCart.items.map(async (item) => {
        const product = await fetchProduct(item.productId);
        return {
          productId: item.productId,
          unitPrice: product.price,
          quantity: item.quantity,
          subtotal: product.price * item.quantity,
        };
      })
    );

    const total = detailedItems.reduce((sum, i) => sum + i.subtotal, 0);

    await createOrder({ items: detailedItems, total });
    showMessage(`Purchase complete! Thank you for your business.`, "success");

    setTimeout(() => {
      loadCartPage();
    }, 1000);
  } catch (error) {
    console.error("Checkout error:", error);
    showMessage("Transaction failed. Please try again.", "error");

    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.textContent = "Purchase";
      checkoutBtn.disabled = false;
    }
  }
}

function showMessage(message, type = "info") {
  let messageEl = document.getElementById("global-message");
  if (!messageEl) {
    messageEl = document.createElement("div");
    messageEl.id = "global-message";
    messageEl.className = "global-message";
    document.body.appendChild(messageEl);
  }

  messageEl.textContent = message;
  messageEl.className = `global-message ${type}`;
  messageEl.style.display = "block";

  if (type === "success") {
    playFF7Sound("item_get");
  } else if (type === "error") {
    playFF7Sound("error");
  } else {
    playFF7Sound("menu_select");
  }

  setTimeout(() => {
    messageEl.style.display = "none";
  }, 3000);
}

function showPageTransition(text = "Loading...") {
  let transition = document.getElementById("ff7-page-transition");
  if (!transition) {
    transition = document.createElement("div");
    transition.id = "ff7-page-transition";
    transition.className = "ff7-page-transition";
    document.body.appendChild(transition);
  }

  transition.innerHTML = `<div class="ff7-transition-text">${text}</div>`;
  transition.classList.add("active");

  playFF7Sound("transition");

  setTimeout(() => {
    transition.classList.remove("active");
  }, 800);
}

const FF7_SOUNDS = {
  menu_select: "sfx/confirmation_positive.wav",
  menu_cursor: "sfx/deck_ui_navigation.wav",
  menu_cancel: "sfx/confirmation_negative.wav",
  item_get: "sfx/deck_ui_achievement_toast.wav",
  error: "sfx/bumper_end.wav",
  modal_open: "sfx/deck_ui_show_modal.wav",
  modal_close: "sfx/deck_ui_hide_modal.wav",
  typing: "sfx/deck_ui_typing.wav",
  transition: "sfx/deck_ui_tab_transition_01.wav",
  toggle_on: "sfx/deck_ui_switch_toggle_on.wav",
  toggle_off: "sfx/deck_ui_switch_toggle_off.wav",
};

let audioContext = null;
let soundVolume = 0.3;

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

async function playFF7Sound(soundType) {
  try {
    const soundPath = FF7_SOUNDS[soundType];
    if (!soundPath) {
      console.warn(`Unknown sound type: ${soundType}`);
      return;
    }

    const audio = new Audio(soundPath);
    audio.volume = soundVolume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Audio autoplay prevented:", error);

        showSoundVisualFeedback(soundType);
      });
    }
  } catch (error) {
    console.warn("Error playing sound:", error);
    showSoundVisualFeedback(soundType);
  }
}

function showSoundVisualFeedback(soundType) {
  const soundIndicator = document.createElement("div");
  soundIndicator.style.position = "fixed";
  soundIndicator.style.top = "10px";
  soundIndicator.style.left = "10px";
  soundIndicator.style.background = "var(--ff7-cursor-blue)";
  soundIndicator.style.color = "white";
  soundIndicator.style.padding = "2px 5px";
  soundIndicator.style.fontSize = "10px";
  soundIndicator.style.borderRadius = "3px";
  soundIndicator.style.zIndex = "10000";
  soundIndicator.style.opacity = "0.8";
  soundIndicator.textContent = `♪ ${soundType}`;
  document.body.appendChild(soundIndicator);

  setTimeout(() => {
    soundIndicator.remove();
  }, 800);
}

document.addEventListener(
  "click",
  () => {
    initAudioContext();
  },
  { once: true }
);

window.playFF7Sound = playFF7Sound;

let currentFocusIndex = 0;
let focusableElements = [];

function updateFocusableElements() {
  focusableElements = Array.from(
    document.querySelectorAll(`
        button:not([disabled]), 
        input:not([disabled]), 
        select:not([disabled]), 
        textarea:not([disabled]), 
        a[href],
        .product-card,
        nav a,
        [tabindex]:not([tabindex="-1"])
    `)
  ).filter((el) => {
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      el.offsetParent !== null
    );
  });
}

function showFF7Cursor() {
  let cursor = document.getElementById("ff7-cursor");
  if (!cursor) {
    cursor = document.createElement("img");
    cursor.id = "ff7-cursor";
    cursor.src = "assets/ui/ffviicursor.png";
    cursor.style.position = "fixed";
    cursor.style.width = "20px";
    cursor.style.height = "20px";
    cursor.style.pointerEvents = "none";
    cursor.style.zIndex = "10001";
    cursor.style.transition = "all 0.1s ease";
    cursor.style.display = "none";
    document.body.appendChild(cursor);
  }
  return cursor;
}

function initializeAudioToggle() {
  const audioToggle = document.createElement("button");
  audioToggle.className = "ff7-audio-toggle";
  audioToggle.id = "ff7-audio-toggle";
  audioToggle.textContent = `♪ ${soundVolume > 0 ? "ON" : "OFF"}`;
  audioToggle.title = "Toggle sound effects";
  document.body.appendChild(audioToggle);

  audioToggle.addEventListener("click", () => {
    soundVolume = soundVolume > 0 ? 0 : 0.3;
    audioToggle.textContent = `♪ ${soundVolume > 0 ? "ON" : "OFF"}`;
    playFF7Sound("toggle_on");

    localStorage.setItem("ff7_sound_enabled", soundVolume > 0);
  });

  const savedSoundPreference = localStorage.getItem("ff7_sound_enabled");
  if (savedSoundPreference === "false") {
    soundVolume = 0;
    audioToggle.textContent = "♪ OFF";
  }
}

function getProductCardClass(product) {
  if (product.categoryId === 1 || product.categoryId === 4) {
    return "weapon-card";
  } else if (product.categoryId === 2) {
    return "materia-card materia-item";
  } else if (product.categoryId === 3) {
    return "item-card";
  }
  return "";
}


function setupProductCardCarousels() {
  document.querySelectorAll('.product-image-container').forEach(container => {
    const images = container.querySelectorAll('.product-image');
    const indicators = container.querySelectorAll('.carousel-indicator');
    const prevBtn = container.querySelector('.carousel-prev');
    const nextBtn = container.querySelector('.carousel-next');
    
    if (images.length <= 1) return; 

    let currentIndex = 0;

    function showImage(index) {
      
      images.forEach(img => img.classList.remove('active'));
      indicators.forEach(indicator => indicator.classList.remove('active'));
      
      
      if (images[index]) {
        images[index].classList.add('active');
      }
      if (indicators[index]) {
        indicators[index].classList.add('active');
      }
      
      currentIndex = index;
    }

    function nextImage() {
      const nextIndex = (currentIndex + 1) % images.length;
      showImage(nextIndex);
      playFF7Sound("menu_cursor");
    }

    function prevImage() {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      showImage(prevIndex);
      playFF7Sound("menu_cursor");
    }

    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nextImage();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevImage();
      });
    }

    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage(index);
        playFF7Sound("menu_select");
      });
    });

    
    let autoAdvanceInterval = setInterval(nextImage, 4000);

    
    container.addEventListener('mouseenter', () => {
      clearInterval(autoAdvanceInterval);
    });

    container.addEventListener('mouseleave', () => {
      autoAdvanceInterval = setInterval(nextImage, 4000);
    });
  });
}


function setupProductDetailImageViewer() {
  const mainImage = document.querySelector('.main-image');
  const thumbnails = document.querySelectorAll('.thumbnail');
  const prevBtn = document.querySelector('.image-prev');
  const nextBtn = document.querySelector('.image-next');
  
  if (!mainImage || thumbnails.length <= 1) return;

  let currentIndex = 0;

  function showMainImage(index) {
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    
    if (thumbnails[index]) {
      thumbnails[index].classList.add('active');
      mainImage.src = thumbnails[index].src;
      mainImage.alt = thumbnails[index].alt;
      mainImage.setAttribute('data-index', index);
    }
    
    currentIndex = index;
  }

  function nextMainImage() {
    const nextIndex = (currentIndex + 1) % thumbnails.length;
    showMainImage(nextIndex);
    playFF7Sound("menu_cursor");
  }

  function prevMainImage() {
    const prevIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
    showMainImage(prevIndex);
    playFF7Sound("menu_cursor");
  }

  
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => {
      showMainImage(index);
      playFF7Sound("menu_select");
    });
  });

  
  if (nextBtn) {
    nextBtn.addEventListener('click', nextMainImage);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', prevMainImage);
  }

}
