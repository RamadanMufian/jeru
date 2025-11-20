// ===============================
// CONFIG — GANTI NOMOR INI
// ===============================

// Format internasional TANPA "+"
//
// Contoh BENAR: 6281234567890
// Contoh SALAH : +6281234567890
//
// Jika belum diganti, semua tombol WhatsApp akan menampilkan warning
const WHATSAPP_NUMBER = "WHATSAPP_NUMBER";


// ===============================
// UTILITIES
// ===============================
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

const formatRupiah = (n) => {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Inject current year
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});


// ===============================
// LOAD PRODUCTS (LOCAL JSON)
// ===============================
async function loadProducts() {
  try {
    const res = await fetch("assets/data/products.json");
    return await res.json();
  } catch (e) {
    console.error("Gagal load products.json", e);
    return [];
  }
}


// ===============================
// RENDER PRODUCT LIST — menu.html
// ===============================
async function renderProductList() {
  const el = qs("#product-list");
  if (!el) return;

  const products = await loadProducts();

  el.innerHTML = products.map(p => `
    <div class="col-sm-6 col-lg-4">
      <article class="card h-100 shadow-sm">
        <img src="${p.image}" alt="${p.name}" class="card-img-top"
             style="height:220px;object-fit:cover;border-radius:12px 12px 0 0;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.name}</h5>
          <p class="card-text text-muted small">${p.description}</p>

          <div class="mt-auto d-flex justify-content-between align-items-center">
            <strong>${formatRupiah(p.price)}</strong>

            <div>
              <a href="product.html?id=${encodeURIComponent(p.id)}"
                 class="btn btn-sm btn-outline-secondary me-2">
                Detail
              </a>
              <button class="btn btn-sm btn-warning text-white btn-order"
                      data-id="${p.id}">
                Pesan
              </button>
            </div>

          </div>
        </div>
      </article>
    </div>
  `).join("");

  // Event listener tombol Pesan
  qsa(".btn-order").forEach(btn => {
    btn.addEventListener("click", () => {
      const prod = products.find(x => x.id === btn.dataset.id);
      if (!prod) return alert("Produk tidak ditemukan.");
      createWhatsAppOrder(prod);
    });
  });
}


// ===============================
// RENDER PRODUCT DETAIL — product.html
// ===============================
async function renderProductDetail() {
  const el = qs("#product-detail");
  if (!el) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const products = await loadProducts();
  const p = products.find(x => x.id === id) || products[0];

  if (!p) {
    el.innerHTML = "<p>Produk tidak ditemukan.</p>";
    return;
  }

  el.innerHTML = `
    <div class="card p-4 shadow-sm">
      <div class="row g-4">
        <div class="col-md-5 text-center">
          <img src="${p.image}" alt="${p.name}" class="img-fluid rounded"
               style="max-height:320px;object-fit:cover;">
        </div>

        <div class="col-md-7">
          <h2>${p.name}</h2>
          <p class="text-muted">${p.description}</p>
          <p><strong>${formatRupiah(p.price)}</strong></p>

          <label class="form-label">Catatan (opsional)</label>
          <input type="text" id="note" class="form-control"
                 placeholder="Misal: tanpa gula, sedikit es">

          <div class="d-flex gap-2 mt-3">
            <button id="wa-order" class="btn btn-warning text-white">
              Pesan via WhatsApp
            </button>
            <a href="menu.html" class="btn btn-outline-secondary">
              Kembali ke Menu
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  qs("#wa-order").addEventListener("click", () => {
    createWhatsAppOrder(p, qs("#note").value);
  });
}


// ===============================
// CREATE WA ORDER LINK
// ===============================
function createWhatsAppOrder(product, note = "") {

  if (WHATSAPP_NUMBER === "WHATSAPP_NUMBER") {
    alert("⚠ SILAKAN SET NOMOR WHATSAPP DI app.js TERLEBIH DAHULU!");
    return;
  }

  const message = `
Pesanan:
- Produk: ${product.name}
- Harga: ${formatRupiah(product.price)}
- Catatan: ${note}

Alamat pengiriman:
`;

  const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  saveOrder({
    id: "order_" + Date.now(),
    productId: product.id,
    productName: product.name,
    price: product.price,
    note,
    createdAt: new Date().toISOString()
  });

  window.open(waURL, "_blank");
}


// ===============================
// SAVE ORDER — localStorage
// ===============================
function saveOrder(order) {
  const arr = JSON.parse(localStorage.getItem("esjeruk_orders") || "[]");
  arr.unshift(order);
  localStorage.setItem("esjeruk_orders", JSON.stringify(arr));
}


// ===============================
// RENDER OWNER ORDERS — orders.html
// ===============================
function renderOrders() {
  const el = qs("#orders-list");
  if (!el) return;

  const arr = JSON.parse(localStorage.getItem("esjeruk_orders") || "[]");

  if (arr.length === 0) {
    el.innerHTML = `
      <div class="col-12">
        <div class="card p-3"><p class="mb-0">Belum ada pesanan.</p></div>
      </div>`;
    return;
  }

  el.innerHTML = arr.map(o => `
    <div class="col-12">
      <div class="card p-3 shadow-sm">
        <div class="d-flex justify-content-between">
          <div>
            <h5>${o.productName}</h5>
            <small class="text-muted">${new Date(o.createdAt).toLocaleString()}</small>
          </div>
          <strong>${formatRupiah(o.price)}</strong>
        </div>
        <p class="mt-2 mb-0">Catatan: ${o.note || "-"}</p>
      </div>
    </div>
  `).join("");
}

function clearOrders() {
  localStorage.removeItem("esjeruk_orders");
  renderOrders();
}


// ===============================
// REVIEWS — localStorage
// ===============================
function initReviews() {
  const form = qs("#review-form");
  const list = qs("#reviews-list");
  if (!form || !list) return;

  function render() {
    const arr = JSON.parse(localStorage.getItem("esjeruk_reviews") || "[]");

    list.innerHTML =
      arr.length === 0
        ? `<div class="card p-3"><p class="mb-0">Tidak ada ulasan.</p></div>`
        : arr.map(r => `
          <div class="list-group-item">
            <div class="d-flex justify-content-between">
              <h6>${r.name}</h6>
              <small class="text-muted">${new Date(r.createdAt).toLocaleDateString()}</small>
            </div>
            <p>${r.text}</p>
          </div>
        `).join("");
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = qs("#review-name").value.trim();
    const text = qs("#review-text").value.trim();
    if (!name || !text) return alert("Isi nama dan ulasan.");

    const arr = JSON.parse(localStorage.getItem("esjeruk_reviews") || "[]");
    arr.unshift({ name, text, createdAt: new Date().toISOString() });

    localStorage.setItem("esjeruk_reviews", JSON.stringify(arr));

    qs("#review-name").value = "";
    qs("#review-text").value = "";
    render();
  });

  render();
}


// ===============================
// CONTACT PAGE — set tombol WA
// ===============================
function initContact() {
  const waBtn = qs("#wa-contact");
  const waDisplay = qs("#wa-display");

  if (waDisplay) {
    waDisplay.textContent =
      WHATSAPP_NUMBER === "WHATSAPP_NUMBER"
        ? "0812xxxxxxx"
        : WHATSAPP_NUMBER;
  }

  if (!waBtn) return;

  waBtn.addEventListener("click", (e) => {
    if (WHATSAPP_NUMBER === "WHATSAPP_NUMBER") {
      e.preventDefault();
      alert("Silakan masukkan nomor WhatsApp usaha Anda di app.js");
    }
  });

  if (WHATSAPP_NUMBER !== "WHATSAPP_NUMBER") {
    waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo, saya ingin memesan...")}`;
  }
}


// ===============================
// GLOBAL INITIALIZATION
// ===============================
(async function () {
  if (qs("#product-list")) await renderProductList();
  if (qs("#product-detail")) await renderProductDetail();

  if (qs("#orders-list")) {
    renderOrders();
    const clearBtn = qs("#clear-orders");
    if (clearBtn) clearBtn.addEventListener("click", clearOrders);
  }

  initReviews();
  initContact();

  // Tombol "Pesan Sekarang" di homepage
  const pesanBtn = qs("#pesanSekarang");
  if (pesanBtn) {
    pesanBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const products = await loadProducts();
      const first = products[0];
      if (!first) return alert("Produk tidak tersedia.");
      createWhatsAppOrder(first, "Pesanan via tombol Pesan Sekarang");
    });
  }
})();
