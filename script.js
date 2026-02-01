// Global Variabel (tempat menampung jika kosong)
let allProductsData = [];
let cart = [];
let currentFilters = {
  search: "",
  price: "all",
};

// Ambil Data dari JSON (Card Produk)
function getData() {
  // Load data dari keranjang belanja ketika buka halaman pertama kali
  // /refresh halaman sebelum display produk
  loadCartFromStorage();

  fetch("./assets/data.json")
    .then((response) => response.json())
    .then((items) => {
      allProductsData = items;
      displayProducts(items);
    })
    .catch((error) => {
      console.error("Error loading products:", error);
    });
}

// Tampilkan Card Produk
function displayProducts(items) {
  const productList = document.getElementById("productList");
  const productCards = [];
  productList.innerHTML = "";

  if (items.length === 0) {
    productList.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: white; background: rgba(0,0,0,0.7); margin: 2rem; border-radius: 10px;">
        <i class="fa fa-search" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <h2>Tidak ada produk ditemukan</h2>
        <p>Coba ubah filter atau kata kunci pencarian</p>
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const menuCard = document.createElement("div");

    const productDetailUrl = `detail.html?id=${encodeURIComponent(item.id)}`;
    menuCard.style.setProperty("--accent-color", item.accent);

    menuCard.className = "product";
    menuCard.style.backgroundImage = `url(${item.image})`;

    menuCard.innerHTML = `
    <div class="product-content">
        <h1 class="title">${item.title}</h1>
        <p class="subtitle">${item.subtitle}</p>

        <div class="product-stats">
            <div class="stat">
                <span class="label">Harga</span>
                <span class="value">Rp. ${item.price}</span>
            </div>
        </div>

        <button class="add-to-cart-btn"
          data-id="${item.id}"
          data-title="${item.title}"
          data-price="${item.price}"
          data-image="${item.image}">
        <i class="fa fa-shopping-cart"></i> Tambah ke Keranjang
        </button>
    </div>
    `;

    const content = menuCard.querySelector(".product-content");

    if (content) {
      content.onclick = () => {
        window.location.href = productDetailUrl;
      };
    }

    productList.appendChild(menuCard);
    productCards.push(menuCard);
  });

  setupCardEvents();

  // Fungsi animasi scroll
  function reveal() {
    for (const menuCard of productCards) {
      const { top, bottom } = menuCard.getBoundingClientRect();
      if (
        top < window.innerHeight * 0.85 &&
        bottom > window.innerHeight * 0.15
      ) {
        menuCard.classList.add("show");
      }
    }
  }

  // Panggil reveal setelah semua card dibuat
  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
  window.addEventListener("resize", reveal);
}

// Setup event listeners (klik button)
function setupCardEvents() {
  const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      const productData = {
        id: this.getAttribute("data-id"),
        title: this.getAttribute("data-title"),
        price: this.getAttribute("data-price"),
        image: this.getAttribute("data-image"),
      };
      addToCart(productData, this);
    });
  });

  const cardTexts = document.querySelectorAll(".card-text");
  cardTexts.forEach((cardText) => {
    cardText.addEventListener("click", function (event) {
      if (event.target.closest(".add-to-cart-btn")) {
        return;
      }
      const href = this.getAttribute("data-href");
      window.location.href = href;
    });
  });
}
// Fungsi search products
function searchProducts() {
  const searchInput = document.getElementById("searchInput");
  currentFilters.search = searchInput.value.toLowerCase().trim();
  applyFilters();
}

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchProducts();
      }, 300);
    });
  }
});
function toggleFilter(event) {
  event.stopPropagation();
  const filterDropdown = document.getElementById("filterDropdown");
  const cartDropdown = document.getElementById("cartDropdown");

  // Close jika salah satu fitur diklik
  if (cartDropdown.classList.contains("active")) {
    cartDropdown.classList.remove("active");
  }
  filterDropdown.classList.toggle("active");
}
// Fungsi kotak filer
function applyFilters() {
  let filteredProducts = allProductsData.filter(
    (item) =>
      item.title.toLowerCase().includes(currentFilters.search) ||
      item.subtitle.toLowerCase().includes(currentFilters.search),
  );

  const priceFilter = document.querySelector('input[name="price"]:checked');
  currentFilters.price = priceFilter ? priceFilter.value : "all";

  if (currentFilters.price === "high-to-low") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (currentFilters.price === "low-to-high") {
    filteredProducts.sort((a, b) => a.price - b.price);
  }

  displayProducts(filteredProducts);
}

// Fungsi cart
function toggleCart(event) {
  if (event) event.stopPropagation();
  const cartDropdown = document.getElementById("cartDropdown");
  const filterDropdown = document.getElementById("filterDropdown");

  // Close jika salah satu fitur diklik
  if (filterDropdown.classList.contains("active")) {
    filterDropdown.classList.remove("active");
  }

  cartDropdown.classList.toggle("active");
}

// Fungsi tambahkan ke Keranjang
function addToCart(productData, buttonElement) {
  const existingItem = cart.find((item) => item.id === productData.id);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      id: productData.id,
      title: productData.title,
      price: productData.price,
      image: productData.image,
      quantity: 1,
    });
  }

  updateCart();
  saveCartToStorage();
  showNotification(`${productData.title} ditambahkan ke keranjang`);

  if (buttonElement) {
    const originalHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = '<i class="fa fa-check"></i> Ditambahkan';
    buttonElement.style.background = "#3ed37c";

    setTimeout(() => {
      buttonElement.innerHTML = originalHTML;
      buttonElement.style.background = "#46bb4a";
    }, 1500);
  }
}

// Update cart ketika user menambahkan/mengurangi produk
function updateCart() {
  const cartCount = document.querySelector(".cart-count");
  const cartItems = document.querySelector(".cart-items");
  const totalPrice = document.getElementById("totalPrice");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;

  // Show/hide tombol hapus semua
  if (cart.length > 0) {
    clearCartBtn.style.display = "block";
  } else {
    clearCartBtn.style.display = "none";
  }

  if (cart.length === 0) {
    cartItems.innerHTML =
      '<div class="cart-empty"><p>Keranjang kosong, <br/>Tambahin Produk Yuk!</p></div>';
  } else {
    cartItems.innerHTML = cart
      .map(
        (item) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.title}</div>
          <div class="cart-item-price">Rp. ${item.price}</div>
          <div class="cart-item-quantity">
            <button class="qty-btn" onclick="updateQuantity(event, '${item.id}', -1)">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity(event, '${item.id}', 1)">+</button>
            <button class="remove-item" onclick="removeItem(event, '${item.id}')">Hapus</button>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  const total = cart.reduce((sum, item) => {
    return sum + Number(item.price) * item.quantity;
  }, 0);
  totalPrice.textContent = `Rp. ${total.toLocaleString()}`;
}

// Update/kurangi item keranjang
function updateQuantity(event, id, change) {
  event.stopPropagation();
  const item = cart.find((item) => item.id === id);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeItem(event, id);
    } else {
      updateCart();
      saveCartToStorage();
    }
  }
}
// Hapus item dari keranjang
function removeItem(event, id) {
  event.stopPropagation();
  cart = cart.filter((item) => item.id !== id);
  updateCart();
  saveCartToStorage();
  showNotification("Produk dihapus dari keranjang");
}

// Checkout
function checkout(event) {
  if (event) event.stopPropagation();

  if (cart.length === 0) {
    alert("Keranjang kosong!");
    return;
  }

  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item.price.replace("Rp.", ""));
    return sum + price * item.quantity;
  }, 0);

  // Format setiap item untuk pesan ke WA saat klik checkout
  const itemList = cart
    .map(
      (item) =>
        `${item.title} x${item.quantity} - ${rupiah.format(Number(item.price) * item.quantity)}`,
    )
    .join("%0A");

  // Pesan lengkap yang dikirim ke wa
  const message =
    `Halo, saya ingin melakukan pemesanan:%0A` +
    `%0A` +
    `${itemList}%0A` +
    `%0A` +
    `Total Pembayaran: ${rupiah.format(total)}%0A` +
    `%0A` +
    `Terima kasih!`;

  // Nomor WA
  const phoneNumber = "62895324895618";

  window.open(
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`,
    "_blank",
  );
  cart = [];
  updateCart();
  saveCartToStorage();

  const cartDropdown = document.getElementById("cartDropdown");
  cartDropdown.classList.remove("active");
}
// Hapus semua dari keranjang
function clearAllCart(event) {
  if (event) event.stopPropagation();

  if (cart.length === 0) return;

  const confirmation = confirm(
    "Apakah Anda yakin ingin menghapus semua item dari keranjang?",
  );

  if (confirmation) {
    cart = [];
    updateCart();
    saveCartToStorage();
    showNotification("Semua item berhasil dihapus dari keranjang");
  }
}

function saveCartToStorage() {
  localStorage.setItem("baksoGacorCart", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const savedCart = localStorage.getItem("baksoGacorCart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCart();
  }
}

// NOTIFICATION
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Tutup dropdowns ketika klik diluar kotak dropdown
document.addEventListener("click", function (e) {
  const cartContainer = document.querySelector(".cart-container");
  const cartDropdown = document.getElementById("cartDropdown");
  const filterContainer = document.querySelector(".filter-container");
  const filterDropdown = document.getElementById("filterDropdown");

  if (
    cartContainer &&
    cartDropdown &&
    !cartContainer.contains(e.target) &&
    !cartDropdown.contains(e.target)
  ) {
    cartDropdown.classList.remove("active");
  }

  if (
    filterContainer &&
    filterDropdown &&
    !filterContainer.contains(e.target) &&
    !filterDropdown.contains(e.target)
  ) {
    filterDropdown.classList.remove("active");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const cartDropdown = document.getElementById("cartDropdown");
  if (cartDropdown) {
    cartDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  const filterDropdown = document.getElementById("filterDropdown");
  if (filterDropdown) {
    filterDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
});

getData();
