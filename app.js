/* ArgiaMart — single-file SPA, vanilla ES6+, no external deps */
(function () {
  "use strict";

  /* ---------------- Constants ---------------- */
  const CATS = ["Makanan", "Minuman", "Snack", "Kebersihan", "Dapur", "Lainnya"];
  const CAT_COUNTS = { Makanan: 100, Minuman: 90, Snack: 80, Kebersihan: 70, Dapur: 80, Lainnya: 80 };
  const PRICE_RANGES = {
    Makanan: [3000, 25000],
    Minuman: [2500, 20000],
    Snack: [5000, 20000],
    Kebersihan: [4000, 35000],
    Dapur: [5000, 80000],
    Lainnya: [3000, 50000]
  };
  const CAT_COLORS = {
    Makanan: ["#ff9a56", "#ff5e62"],
    Minuman: ["#56ccf2", "#2f80ed"],
    Snack: ["#f7b733", "#fc4a1a"],
    Kebersihan: ["#43e97b", "#38f9d7"],
    Dapur: ["#a18cd1", "#fbc2eb"],
    Lainnya: ["#30cfd0", "#330867"]
  };
  const CAT_EMOJIS = {
    Makanan: ["🍜", "🍛", "🍲", "🍚", "🥘", "🍝", "🍱", "🥡"],
    Minuman: ["🥤", "🧃", "🧋", "☕", "🍵", "🥛", "🍶", "🧊"],
    Snack: ["🍪", "🍫", "🍬", "🥨", "🍿", "🍩", "🧁", "🍭"],
    Kebersihan: ["🧴", "🧼", "🪥", "🧽", "🧻", "🪒", "🧺", "🧯"],
    Dapur: ["🍳", "🥄", "🍴", "🔪", "🍶", "🧂", "🫙", "🥣"],
    Lainnya: ["📦", "🔋", "💡", "📓", "✏️", "📌", "🔌", "🗂️"]
  };
  const CAT_ICONS = {
    Makanan: "🍜", Minuman: "🥤", Snack: "🍪",
    Kebersihan: "🧴", Dapur: "🍳", Lainnya: "📦"
  };

  const LS = {
    users: "argiamart_users",
    session: "argiamart_session",
    cart: "argiamart_cart",
    orders: "argiamart_orders",
    theme: "argiamart_theme"
  };

  /* ---------------- State ---------------- */
  let products = [];
  let cart = [];
  let currentUser = null;
  const state = {
    q: "",
    cats: new Set(),
    minPrice: 0,
    maxPrice: 80000,
    sort: "default",
    page: 1
  };

  /* ---------------- Utils ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function formatRupiah(n) {
    return "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function hashPwd(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  function readLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), ms);
    };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function imgTag(emoji, color) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + color[0] + '"/>' +
      '<stop offset="1" stop-color="' + color[1] + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="200" height="200" fill="url(#g)"/>' +
      '<text x="100" y="105" font-size="100" text-anchor="middle" dominant-baseline="middle" ' +
      'font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">' + emoji + '</text>' +
      '</svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  /* ---------------- Product generation ---------------- */
  const NAME_POOLS = {
    Makanan: {
      bases: ["Indomie", "Mie Sedaap", "Sarimi", "Pop Mie", "Supermi", "Nissin", "ABC", "Mama Suka", "Bumbu Desa", "Sari Rasa", "Kari Ayam", "Rice Bowl", "Bakmi", "Kwetiau", "Bihun"],
      variants: ["Goreng", "Soto", "Ayam Bawang", "Kari Spesial", "Rendang", "Sambal Matah", "Seafood", "Sayur", "Baso", "Rawon"],
      suffixes: ["Reguler", "Jumbo", "Pedas", "Spesial", "Family"]
    },
    Minuman: {
      bases: ["Teh Botol", "Coca Cola", "Fanta", "Sprite", "Aqua", "Pulpy", "Buavita", "Floridina", "Mizone", "Isotonik", "Kapal Api", "Good Day", "Nescafe", "Ultra Milk", "Frisian Flag"],
      variants: ["Original", "Less Sugar", "Strawberry", "Mango", "Orange", "Lychee", "Cappuccino", "Mocha", "Vanilla", "Choco"],
      suffixes: ["250ml", "350ml", "500ml", "1L", "Botol", "Kaleng"]
    },
    Snack: {
      bases: ["Chitato", "Lays", "Taro", "Qtela", "Pringles", "Oreo", "Roma", "Beng Beng", "KitKat", "Silverqueen", "Cadbury", "Delfi", "Wrigley", "Kopiko", "Tic Tac"],
      variants: ["Sapi Panggang", "Rumput Laut", "Keju", "Cokelat", "Vanilla", "Strawberry", "BBQ", "Jagung Bakar", "Original", "Mint"],
      suffixes: ["68g", "100g", "150g", "Pack", "Family"]
    },
    Kebersihan: {
      bases: ["Lifebuoy", "Dettol", "Pepsodent", "Close Up", "Sensodyne", "Rinso", "So Klin", "Attack", "Sunlight", "Mama Lemon", "Softex", "Cussons", "Wipol", "Bayclin", "Stella"],
      variants: ["Sabun Cair", "Sabun Batang", "Pasta Gigi", "Deterjen", "Pembersih Lantai", "Pemutih", "Shampoo", "Body Wash", "Hand Wash", "Tisu Basah"],
      suffixes: ["Refill", "Botol", "Sachet", "100ml", "500ml"]
    },
    Dapur: {
      bases: ["Beras", "Minyak Goreng", "Gula Pasir", "Garam", "Tepung", "Kecap", "Saus", "Santan", "Mentega", "Margarin", "Telur", "Susu Bubuk", "Baking Powder", "Bumbu Instan", "Kaldu"],
      variants: ["Premium", "Ekonomis", "Pilihan", "Spesial", "Organik", "Segar", "Wangi", "Kemasan", "Kualitas", "Hemat"],
      suffixes: ["1kg", "500g", "250g", "1L", "2L", "Pack"]
    },
    Lainnya: {
      bases: ["Baterai ABC", "Baterai Energizer", "Lampu Philips", "Lampu Osram", "Tisu Paseo", "Tisu Kleenex", "Korek Api", "Lilin", "Pulpen Standard", "Buku Tulis", "Penghapus", "Penggaris", "Stapler", "Spidol", "Lem Fox"],
      variants: ["AA", "AAA", "9W", "12W", "Isi 10", "Isi 5", "Putih", "Hitam", "Warna", "Besar", "Kecil", "Sedang", "Original", "Refill", "Premium"],
      suffixes: ["Pack", "Unit", "Set", "Dus", "Bungkus"]
    }
  };

  const DESC_BUILDERS = {
    Makanan: n => n + " — makanan praktis dengan cita rasa rumahan, siap disajikan kapan saja untuk stok dapur Anda.",
    Minuman: n => n + " — minuman segar penyegar hari, cocok dinikmati dingin maupun dalam suhu ruang.",
    Snack: n => n + " — camilan renyah dengan rasa gurih yang pas untuk teman santai atau kerja.",
    Kebersihan: n => n + " — kebutuhan kebersihan andalan untuk menjaga rumah tetap bersih dan wangi.",
    Dapur: n => n + " — bahan dapur pilihan dengan kualitas terjamin untuk masakan sehari-hari.",
    Lainnya: n => n + " — kebutuhan rumah tangga serbaguna, praktis, dan siap pakai."
  };

  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function generateProducts() {
    const out = [];
    let id = 1;
    CATS.forEach(cat => {
      const pool = NAME_POOLS[cat];
      const need = CAT_COUNTS[cat];
      const combos = [];
      for (const b of pool.bases) {
        for (const v of pool.variants) {
          for (const s of pool.suffixes) {
            combos.push(b + " " + v + " " + s);
          }
        }
      }
      const shuffled = shuffleArr(combos);
      const seen = new Set();
      const picked = [];
      for (const c of shuffled) {
        if (picked.length >= need) break;
        if (seen.has(c)) continue;
        seen.add(c);
        picked.push(c);
      }
      let extra = 0;
      while (picked.length < need) {
        const name = pool.bases[extra % pool.bases.length] + " Varian " + (++extra);
        if (!seen.has(name)) { seen.add(name); picked.push(name); }
      }
      const range = PRICE_RANGES[cat];
      const emojis = CAT_EMOJIS[cat];
      const color = CAT_COLORS[cat];
      picked.forEach((name) => {
        const price = Math.round((range[0] + Math.random() * (range[1] - range[0])) / 500) * 500;
        const stock = Math.random() < 0.08 ? 0 : Math.floor(Math.random() * 101);
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        out.push({
          id: id++,
          name: name,
          cat: cat,
          price: price,
          stock: stock,
          desc: DESC_BUILDERS[cat](name),
          emoji: emoji,
          color: color,
          img: imgTag(emoji, color)
        });
      });
    });
    return out;
  }

  function productById(id) {
    return products.find(p => p.id === Number(id));
  }

  /* ---------------- Theme ---------------- */
  function initTheme() {
    const saved = localStorage.getItem(LS.theme) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    updateThemeBtn(saved);
  }
  function updateThemeBtn(theme) {
    const btn = $("#themeToggle");
    if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(LS.theme, next);
    updateThemeBtn(next);
  }

  /* ---------------- Auth ---------------- */
  function getUsers() { return readLS(LS.users, []); }
  function saveUsers(u) { writeLS(LS.users, u); }

  function getSession() { return readLS(LS.session, null); }
  function saveSession(s) { writeLS(LS.session, s); }
  function clearSession() { localStorage.removeItem(LS.session); }

  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  function registerUser(name, email, password) {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "Email sudah terdaftar." };
    }
    const user = {
      email: email,
      name: name,
      password_hash: hashPwd(password),
      created: new Date().toISOString(),
      address: null
    };
    users.push(user);
    saveUsers(users);
    return { ok: true, user: user };
  }

  function loginUser(email, password) {
    const users = getUsers();
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return { ok: false, error: "Email tidak terdaftar." };
    if (u.password_hash !== hashPwd(password)) return { ok: false, error: "Password salah." };
    const session = { email: u.email, name: u.name, loginAt: new Date().toISOString() };
    saveSession(session);
    currentUser = session;
    refreshAuthUI();
    return { ok: true };
  }

  function logout() {
    clearSession();
    currentUser = null;
    refreshAuthUI();
    navigate("home");
    toast("Anda telah keluar.", "warn");
  }

  function refreshAuthUI() {
    const accountBtn = $("#accountBtn");
    if (currentUser) {
      accountBtn.textContent = "👤";
      accountBtn.title = currentUser.name;
    } else {
      accountBtn.textContent = "👤";
      accountBtn.title = "Masuk";
    }
  }

  /* ---------------- Cart ---------------- */
  function loadCart() {
    cart = readLS(LS.cart, []);
    if (!Array.isArray(cart)) cart = [];
  }
  function saveCart() {
    writeLS(LS.cart, cart);
    updateCartBadge();
    renderCart();
  }
  function updateCartBadge() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    $("#cartBadge").textContent = n;
  }

  function addToCart(id, qty) {
    const p = productById(id);
    if (!p) return;
    qty = qty || 1;
    if (p.stock === 0) { toast("Stok habis.", "err"); return; }
    const existing = cart.find(i => i.id === p.id);
    const currentQty = existing ? existing.qty : 0;
    if (currentQty + qty > p.stock) {
      toast("Melebihi stok tersedia (" + p.stock + ").", "err");
      return;
    }
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: p.id, name: p.name, price: p.price, qty: qty, emoji: p.emoji, cat: p.cat });
    }
    saveCart();
    toast(p.name + " ditambahkan ke keranjang.", "ok");
  }

  function changeQty(id, delta) {
    const item = cart.find(i => i.id === Number(id));
    if (!item) return;
    const p = productById(id);
    const max = p ? p.stock : item.qty + delta;
    const next = item.qty + delta;
    if (next <= 0) { removeItem(id); return; }
    if (p && next > p.stock) { toast("Stok tersedia: " + p.stock + ".", "err"); return; }
    item.qty = next;
    saveCart();
  }

  function removeItem(id) {
    cart = cart.filter(i => i.id !== Number(id));
    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
  }

  function cartTotals() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal === 0 ? 0 : (subtotal >= 100000 ? 0 : 10000);
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + shipping + tax;
    return { subtotal: subtotal, shipping: shipping, tax: tax, total: total };
  }

  function renderCart() {
    const itemsEl = $("#cartItems");
    const summaryEl = $("#cartSummary");
    if (!itemsEl || !summaryEl) return;
    if (cart.length === 0) {
      itemsEl.innerHTML = '<div class="empty-state"><div class="empty-emoji">🛒</div><p>Keranjang masih kosong.</p></div>';
      summaryEl.innerHTML = "";
      return;
    }
    itemsEl.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div class="cart-item-img" data-open-product="${i.id}">
          <img src="${productById(i.id) ? productById(i.id).img : imgTag(i.emoji, CAT_COLORS[i.cat])}" alt="">
        </div>
        <div class="cart-item-body">
          <div class="cart-item-name">${escapeHtml(i.name)}</div>
          <div class="cart-item-price">${formatRupiah(i.price)}</div>
          <div class="qty-row">
            <button class="qty-btn" data-cart-qty="${i.id}" data-delta="-1">−</button>
            <span class="qty-val">${i.qty}</span>
            <button class="qty-btn" data-cart-qty="${i.id}" data-delta="1">+</button>
            <button class="qty-remove" data-cart-remove="${i.id}">Hapus</button>
          </div>
        </div>
        <div class="cart-item-sub">${formatRupiah(i.price * i.qty)}</div>
      </div>
    `).join("");

    const t = cartTotals();
    summaryEl.innerHTML = `
      <div class="sum-row"><span>Subtotal</span><span>${formatRupiah(t.subtotal)}</span></div>
      <div class="sum-row"><span>Ongkir</span><span>${t.shipping === 0 ? "Gratis" : formatRupiah(t.shipping)}</span></div>
      <div class="sum-row"><span>PPN 11%</span><span>${formatRupiah(t.tax)}</span></div>
      <div class="sum-row sum-total"><span>Total</span><span>${formatRupiah(t.total)}</span></div>
      <button class="btn btn-primary btn-block" id="checkoutBtn">Checkout</button>
    `;
    const btn = $("#checkoutBtn");
    if (btn) btn.addEventListener("click", startCheckout);
  }

  /* ---------------- Orders ---------------- */
  function getOrders() {
    const all = readLS(LS.orders, {});
    if (Array.isArray(all)) return {};
    return all || {};
  }
  function saveOrders(o) { writeLS(LS.orders, o); }

  function userOrders(email) {
    const all = getOrders();
    return all[email] || [];
  }

  function createOrder(formData) {
    const t = cartTotals();
    const order = {
      id: "AGM" + Date.now().toString().slice(-8),
      email: currentUser.email,
      items: cart.map(i => Object.assign({}, i)),
      address: formData,
      payment: formData.payment,
      subtotal: t.subtotal,
      shipping: t.shipping,
      tax: t.tax,
      total: t.total,
      status: "Diproses",
      date: new Date().toISOString()
    };
    const all = getOrders();
    if (!all[currentUser.email]) all[currentUser.email] = [];
    all[currentUser.email].unshift(order);
    saveOrders(all);

    /* reduce stock */
    cart.forEach(ci => {
      const p = productById(ci.id);
      if (p) p.stock = Math.max(0, p.stock - ci.qty);
    });

    clearCart();
    return order;
  }

  /* ---------------- Renderers ---------------- */
  function productCard(p) {
    const out = p.stock === 0;
    return `
      <div class="product-card">
        <div class="product-img" data-open-product="${p.id}">
          <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy">
          <span class="product-badge ${out ? "bad" : "ok"}">${out ? "Habis" : "Stok " + p.stock}</span>
        </div>
        <div class="product-body">
          <div class="product-cat">${p.cat}</div>
          <div class="product-name" data-open-product="${p.id}">${escapeHtml(p.name)}</div>
          <div class="product-price">${formatRupiah(p.price)}</div>
          <button class="btn btn-primary btn-sm" data-add="${p.id}" ${out ? "disabled" : ""}>+ Keranjang</button>
        </div>
      </div>
    `;
  }

  function renderHome() {
    const best = products.filter(p => p.stock > 0);
    const pick = shuffleArr(best).slice(0, 8);
    const bs = $("#homeBestSellers");
    if (bs) bs.innerHTML = pick.map(productCard).join("");

    const catsEl = $("#homeCategories");
    if (catsEl) {
      catsEl.innerHTML = CATS.slice(0, 6).map(c => `
        <div class="category-tile" data-jump-cat="${c}">
          <div class="category-icon">${CAT_ICONS[c]}</div>
          <div class="category-name">${c}</div>
          <div class="category-count">${CAT_COUNTS[c]} produk</div>
        </div>
      `).join("");
    }
  }

  function renderCategoryCards() {
    const el = $("#categoryCards");
    if (!el) return;
    el.innerHTML = CATS.map(c => `
      <div class="category-card" data-jump-cat="${c}">
        <div class="category-card-icon">${CAT_ICONS[c]}</div>
        <div class="category-card-body">
          <h3>${c}</h3>
          <p>${CAT_COUNTS[c]} produk tersedia</p>
        </div>
        <div class="category-card-arrow">→</div>
      </div>
    `).join("");
  }

  function renderCatFilters() {
    const el = $("#catFilters");
    if (!el) return;
    el.innerHTML = CATS.map(c => `
      <label class="check-row">
        <input type="checkbox" value="${c}" ${state.cats.has(c) ? "checked" : ""}>
        <span>${c}</span>
      </label>
    `).join("");
    $$("#catFilters input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) state.cats.add(cb.value);
        else state.cats.delete(cb.value);
        state.page = 1;
        renderProductList();
      });
    });
  }

  function filteredProducts() {
    const q = state.q.toLowerCase();
    let list = products.filter(p => {
      if (q && p.name.toLowerCase().indexOf(q) === -1) return false;
      if (state.cats.size > 0 && !state.cats.has(p.cat)) return false;
      if (p.price < state.minPrice || p.price > state.maxPrice) return false;
      return true;
    });
    if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (state.sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (state.sort === "stock") list.sort((a, b) => b.stock - a.stock);
    return list;
  }

  function renderProductList() {
    const grid = $("#productGrid");
    const counter = $("#resultCounter");
    const pagEl = $("#pagination");
    if (!grid) return;
    const list = filteredProducts();
    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * perPage;
    const pageItems = list.slice(start, start + perPage);
    grid.innerHTML = pageItems.length
      ? pageItems.map(productCard).join("")
      : '<div class="empty-state" style="grid-column:1/-1"><div class="empty-emoji">🔍</div><p>Tidak ada produk yang cocok.</p></div>';
    if (counter) counter.textContent = "Menampilkan " + pageItems.length + " dari " + list.length + " produk";
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const el = $("#pagination");
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ""; return; }
    let html = "";
    html += `<button class="page-btn" data-page-num="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}>‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 9 && i !== 1 && i !== totalPages && Math.abs(i - state.page) > 2) {
        if (i === 2 || i === totalPages - 1) html += `<span class="page-gap">…</span>`;
        continue;
      }
      html += `<button class="page-btn ${i === state.page ? "active" : ""}" data-page-num="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" data-page-num="${state.page + 1}" ${state.page === totalPages ? "disabled" : ""}>›</button>`;
    el.innerHTML = html;
  }

  function openProductModal(id) {
    const p = productById(id);
    if (!p) return;
    const out = p.stock === 0;
    $("#productModalBody").innerHTML = `
      <div class="detail-grid">
        <div class="detail-img"><img src="${p.img}" alt="${escapeHtml(p.name)}"></div>
        <div class="detail-body">
          <div class="product-cat">${p.cat}</div>
          <h2 class="detail-name">${escapeHtml(p.name)}</h2>
          <div class="detail-price">${formatRupiah(p.price)}</div>
          <div class="detail-stock ${out ? "bad" : "ok"}">${out ? "Stok habis" : "Stok tersedia: " + p.stock}</div>
          <p class="detail-desc">${escapeHtml(p.desc)}</p>
          <div class="qty-row">
            <button class="qty-btn" data-modal-qty="-1">−</button>
            <input id="modalQty" class="qty-input" type="number" min="1" max="${p.stock || 1}" value="1" ${out ? "disabled" : ""}>
            <button class="qty-btn" data-modal-qty="1">+</button>
          </div>
          <button class="btn btn-primary btn-block" data-add-modal="${p.id}" ${out ? "disabled" : ""}>Tambah ke Keranjang</button>
        </div>
      </div>
    `;
    openModal("productModal");
  }

  function renderTutorial() {
    const stepsEl = $("#tutorialSteps");
    if (!stepsEl) return;
    const STEPS = [
      { icon: "📝", title: "Daftar Akun", desc: "Buka halaman Masuk, pilih tab Daftar, lalu isi nama, email, dan password. Klik tombol Daftar untuk membuat akun baru." },
      { icon: "🔑", title: "Login", desc: "Masuk menggunakan email dan password yang sudah terdaftar. Sesi Anda akan tersimpan otomatis." },
      { icon: "🔍", title: "Cari Produk", desc: "Gunakan search bar di navbar, atau buka halaman Produk dan pakai filter kategori serta rentang harga." },
      { icon: "👀", title: "Lihat Detail", desc: "Klik kartu produk untuk membuka detail. Di sana terlihat deskripsi, harga, dan stok tersedia." },
      { icon: "➕", title: "Tambah ke Keranjang", desc: "Klik tombol + Keranjang, atau atur jumlah dulu di modal detail sebelum menambahkan." },
      { icon: "🧾", title: "Review Keranjang", desc: "Buka drawer keranjang di kanan. Cek ulang item, jumlah, dan total sebelum checkout." },
      { icon: "💳", title: "Checkout", desc: "Isi alamat pengiriman lengkap, pilih metode bayar, lalu konfirmasi pesanan." },
      { icon: "📦", title: "Terima Pesanan", desc: "Pantau status pesanan di halaman Pesanan — dari Diproses, Dikirim, hingga Selesai." }
    ];
    stepsEl.innerHTML = STEPS.map((s, i) => `
      <div class="tutorial-step">
        <div class="step-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="step-icon">${s.icon}</div>
        <div class="step-body">
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
        </div>
      </div>
    `).join("");

    const faqEl = $("#faqList");
    if (!faqEl) return;
    const FAQS = [
      { q: "Bagaimana cara mendaftar akun?", a: "Buka halaman Masuk lewat tombol akun di navbar, pilih tab Daftar, isi nama, email valid, dan password minimal 6 karakter. Klik Daftar — akun langsung aktif." },
      { q: "Saya lupa password, bagaimana?", a: "Saat ini pemulihan password dilakukan lewat Customer Service. Hubungi CS dengan menyertakan email terdaftar dan bukti kepemilikan akun." },
      { q: "Berapa biaya ongkos kirim?", a: "Ongkir flat Rp10.000 per pesanan. Gratis ongkir otomatis untuk pembelian dengan subtotal Rp100.000 ke atas." },
      { q: "Metode pembayaran apa yang tersedia?", a: "Tersedia COD (bayar di tempat), Transfer Bank, dan E-Wallet. Pilih salah satu saat checkout." },
      { q: "Bisakah saya mengembalikan barang?", a: "Pengembalian dapat diajukan maksimal 2×24 jam setelah pesanan diterima, dengan syarat produk belum dibuka dan kondisi masih utuh. Hubungi CS untuk prosesnya." },
      { q: "Bagaimana cara menghubungi Customer Service?", a: "CS ArgiaMart dapat dihubungi lewat email cs@argiamart.local atau WhatsApp di 0812-0000-0000, setiap hari 08.00–20.00 WIB." }
    ];
    faqEl.innerHTML = FAQS.map((f, i) => `
      <div class="faq-item" data-faq="${i}">
        <div class="faq-q">${escapeHtml(f.q)}<span class="faq-arrow">+</span></div>
        <div class="faq-a"><p>${escapeHtml(f.a)}</p></div>
      </div>
    `).join("");
    $$(".faq-item").forEach(item => {
      item.querySelector(".faq-q").addEventListener("click", () => {
        item.classList.toggle("open");
        const arrow = item.querySelector(".faq-arrow");
        arrow.textContent = item.classList.contains("open") ? "−" : "+";
      });
    });
  }

  function renderOrders() {
    const el = $("#ordersList");
    if (!el) return;
    if (!currentUser) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-emoji">🔒</div>
          <p>Silakan login dulu untuk melihat pesanan Anda.</p>
          <button class="btn btn-primary" data-page="auth">Masuk Sekarang</button>
        </div>`;
      return;
    }
    const orders = userOrders(currentUser.email);
    if (orders.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-emoji">📭</div>
          <p>Belum ada pesanan.</p>
          <button class="btn btn-primary" data-page="products">Mulai Belanja</button>
        </div>`;
      return;
    }
    el.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-head">
          <div>
            <div class="order-id">${o.id}</div>
            <div class="order-date">${new Date(o.date).toLocaleString("id-ID")}</div>
          </div>
          <div class="order-status status-${o.status.toLowerCase()}">${o.status}</div>
        </div>
        <div class="timeline">
          ${["Diproses", "Dikirim", "Selesai"].map((s, i) => {
            const idx = ["Diproses", "Dikirim", "Selesai"].indexOf(o.status);
            const cls = i <= idx ? "done" : "";
            const cur = i === idx ? "current" : "";
            return `<div class="tl-step ${cls} ${cur}"><span class="tl-dot"></span><span class="tl-label">${s}</span></div>`;
          }).join("")}
        </div>
        <div class="order-items">
          ${o.items.map(it => `<span class="order-chip">${escapeHtml(it.name)} × ${it.qty}</span>`).join("")}
        </div>
        <div class="order-foot">
          <div class="order-total">Total: <strong>${formatRupiah(o.total)}</strong></div>
          <button class="btn btn-ghost btn-sm" data-order-id="${o.id}">Lihat Invoice</button>
        </div>
      </div>
    `).join("");
  }

  function renderProfile() {
    const el = $("#profileContent");
    if (!el) return;
    if (!currentUser) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-emoji">🔒</div>
          <p>Silakan login dulu untuk melihat profil.</p>
          <button class="btn btn-primary" data-page="auth">Masuk Sekarang</button>
        </div>`;
      return;
    }
    const users = getUsers();
    const u = users.find(x => x.email === currentUser.email);
    const addr = (u && u.address) || {};
    const orders = userOrders(currentUser.email);
    const totalSpent = orders.reduce((s, o) => s + o.total, 0);
    el.innerHTML = `
      <div class="profile-grid">
        <div class="panel">
          <h3>Data Akun</h3>
          <div class="profile-row"><span>Nama</span><span>${escapeHtml(currentUser.name)}</span></div>
          <div class="profile-row"><span>Email</span><span>${escapeHtml(currentUser.email)}</span></div>
          <div class="profile-row"><span>Bergabung</span><span>${u ? new Date(u.created).toLocaleDateString("id-ID") : "-"}</span></div>
          <div class="profile-row"><span>Total Pesanan</span><span>${orders.length}</span></div>
          <div class="profile-row"><span>Total Belanja</span><span>${formatRupiah(totalSpent)}</span></div>
          <button class="btn btn-danger btn-block" id="logoutBtn">Keluar</button>
        </div>
        <div class="panel">
          <h3>Alamat Default</h3>
          <form id="addressForm">
            <label>Nama Penerima<input id="prName" type="text" value="${escapeHtml(addr.name || "")}"></label>
            <label>No. HP<input id="prPhone" type="tel" value="${escapeHtml(addr.phone || "")}"></label>
            <label>Alamat Lengkap<textarea id="prAddress" rows="3">${escapeHtml(addr.address || "")}</textarea></label>
            <label>Kota<input id="prCity" type="text" value="${escapeHtml(addr.city || "")}"></label>
            <label>Kode Pos<input id="prZip" type="text" value="${escapeHtml(addr.zip || "")}"></label>
            <button type="submit" class="btn btn-primary btn-block">Simpan Alamat</button>
          </form>
        </div>
        <div class="panel panel-wide">
          <h3>Riwayat Pesanan</h3>
          ${orders.length === 0
            ? '<p class="muted">Belum ada pesanan.</p>'
            : orders.slice(0, 5).map(o => `
              <div class="profile-row">
                <span>${o.id} · ${new Date(o.date).toLocaleDateString("id-ID")}</span>
                <span><span class="order-status status-${o.status.toLowerCase()}">${o.status}</span> · ${formatRupiah(o.total)}</span>
              </div>
            `).join("")}
        </div>
      </div>
    `;
    $("#logoutBtn").addEventListener("click", logout);
    $("#addressForm").addEventListener("submit", e => {
      e.preventDefault();
      const data = {
        name: $("#prName").value.trim(),
        phone: $("#prPhone").value.trim(),
        address: $("#prAddress").value.trim(),
        city: $("#prCity").value.trim(),
        zip: $("#prZip").value.trim()
      };
      const allUsers = getUsers();
      const target = allUsers.find(x => x.email === currentUser.email);
      if (target) {
        target.address = data;
        saveUsers(allUsers);
        toast("Alamat default disimpan.", "ok");
      }
    });
  }

  /* ---------------- Modal / drawer ---------------- */
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("open");
    document.body.classList.add("no-scroll");
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("open");
    if (!document.querySelector(".modal.open")) document.body.classList.remove("no-scroll");
  }
  function closeAllModals() {
    $$(".modal.open").forEach(m => m.classList.remove("open"));
    document.body.classList.remove("no-scroll");
  }

  function openCart() {
    $("#cartDrawer").classList.add("open");
    $("#cartBackdrop").classList.add("open");
    document.body.classList.add("no-scroll");
  }
  function closeCart() {
    $("#cartDrawer").classList.remove("open");
    $("#cartBackdrop").classList.remove("open");
    if (!document.querySelector(".modal.open")) document.body.classList.remove("no-scroll");
  }

  /* ---------------- Toast ---------------- */
  function toast(msg, type) {
    const el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.textContent = msg;
    $("#toastContainer").appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  /* ---------------- Checkout ---------------- */
  function startCheckout() {
    if (cart.length === 0) { toast("Keranjang kosong.", "err"); return; }
    if (!currentUser) {
      closeCart();
      openModal("loginRequiredModal");
      return;
    }
    prefillCheckout();
    renderCheckoutSummary();
    closeCart();
    openModal("checkoutModal");
  }

  function prefillCheckout() {
    const users = getUsers();
    const u = users.find(x => x.email === currentUser.email);
    const a = (u && u.address) || {};
    $("#coName").value = a.name || currentUser.name || "";
    $("#coPhone").value = a.phone || "";
    $("#coAddress").value = a.address || "";
    $("#coCity").value = a.city || "";
    $("#coZip").value = a.zip || "";
  }

  function renderCheckoutSummary() {
    const t = cartTotals();
    $("#checkoutSummary").innerHTML = `
      <h4>Ringkasan Pesanan</h4>
      ${cart.map(i => `<div class="sum-row"><span>${escapeHtml(i.name)} × ${i.qty}</span><span>${formatRupiah(i.price * i.qty)}</span></div>`).join("")}
      <div class="sum-divider"></div>
      <div class="sum-row"><span>Subtotal</span><span>${formatRupiah(t.subtotal)}</span></div>
      <div class="sum-row"><span>Ongkir</span><span>${t.shipping === 0 ? "Gratis" : formatRupiah(t.shipping)}</span></div>
      <div class="sum-row"><span>PPN 11%</span><span>${formatRupiah(t.tax)}</span></div>
      <div class="sum-row sum-total"><span>Total</span><span>${formatRupiah(t.total)}</span></div>
    `;
  }

  function submitCheckout(e) {
    e.preventDefault();
    const name = $("#coName").value.trim();
    const phone = $("#coPhone").value.trim();
    const address = $("#coAddress").value.trim();
    const city = $("#coCity").value.trim();
    const zip = $("#coZip").value.trim();
    const payment = $("#coPayment").value;
    if (!name || !phone || !address || !city || !zip) {
      toast("Lengkapi semua data alamat.", "err");
      return;
    }
    if (cart.length === 0) { toast("Keranjang kosong.", "err"); return; }
    const order = createOrder({ name, phone, address, city, zip, payment });
    closeModal("checkoutModal");
    showInvoice(order);
    renderHome();
    renderProductList();
    renderOrders();
    toast("Pesanan berhasil dibuat.", "ok");
  }

  function showInvoice(order) {
    const itemRows = order.items.map(i => `
      <tr>
        <td>${escapeHtml(i.name)}</td>
        <td class="t-right">${i.qty}</td>
        <td class="t-right">${formatRupiah(i.price * i.qty)}</td>
      </tr>
    `).join("");
    $("#invoiceBody").innerHTML = `
      <div class="receipt">
        <div class="receipt-head">
          <div class="receipt-logo">A</div>
          <div>
            <div class="receipt-title">ArgiaMart</div>
            <div class="receipt-sub">Struk Pembelian</div>
          </div>
        </div>
        <div class="receipt-meta">
          <div><span>No. Pesanan</span><span>${order.id}</span></div>
          <div><span>Tanggal</span><span>${new Date(order.date).toLocaleString("id-ID")}</span></div>
          <div><span>Status</span><span>${order.status}</span></div>
          <div><span>Pembayaran</span><span>${escapeHtml(order.payment)}</span></div>
        </div>
        <div class="receipt-section">
          <div class="receipt-section-title">Penerima</div>
          <div>${escapeHtml(order.address.name)}</div>
          <div>${escapeHtml(order.address.phone)}</div>
          <div>${escapeHtml(order.address.address)}, ${escapeHtml(order.address.city)} ${escapeHtml(order.address.zip)}</div>
        </div>
        <table class="receipt-table">
          <thead><tr><th>Produk</th><th class="t-right">Qty</th><th class="t-right">Subtotal</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="receipt-totals">
          <div><span>Subtotal</span><span>${formatRupiah(order.subtotal)}</span></div>
          <div><span>Ongkir</span><span>${order.shipping === 0 ? "Gratis" : formatRupiah(order.shipping)}</span></div>
          <div><span>PPN 11%</span><span>${formatRupiah(order.tax)}</span></div>
          <div class="receipt-grand"><span>Total</span><span>${formatRupiah(order.total)}</span></div>
        </div>
        <div class="receipt-footer">Terima kasih telah berbelanja di ArgiaMart.</div>
      </div>
    `;
    openModal("invoiceModal");
  }

  /* ---------------- Routing ---------------- */
  function navigate(page) {
    const target = document.getElementById("page-" + page);
    if (!target) return;
    $$(".page").forEach(p => p.classList.remove("active"));
    target.classList.add("active");
    $$(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.page === page));
    window.scrollTo({ top: 0, behavior: "auto" });
    if (page === "home") renderHome();
    if (page === "products") { renderCatFilters(); renderProductList(); }
    if (page === "categories") renderCategoryCards();
    if (page === "tutorial") renderTutorial();
    if (page === "orders") renderOrders();
    if (page === "profile") renderProfile();
    if (page === "auth") resetAuthForms();
    closeCart();
  }

  function resetAuthForms() {
    $$(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === "login"));
    $$(".auth-form").forEach(f => f.classList.toggle("active", f.id === "loginForm"));
    $$(".field-err").forEach(e => e.textContent = "");
  }

  /* ---------------- Auth form handlers ---------------- */
  function handleRegister(e) {
    e.preventDefault();
    const name = $("#regName").value.trim();
    const email = $("#regEmail").value.trim();
    const pw = $("#regPassword").value;
    const pw2 = $("#regPassword2").value;
    let ok = true;
    $("#regNameErr").textContent = "";
    $("#regEmailErr").textContent = "";
    $("#regPasswordErr").textContent = "";
    $("#regPassword2Err").textContent = "";
    if (name.length < 2) { $("#regNameErr").textContent = "Nama minimal 2 karakter."; ok = false; }
    if (!isValidEmail(email)) { $("#regEmailErr").textContent = "Format email tidak valid."; ok = false; }
    if (pw.length < 6) { $("#regPasswordErr").textContent = "Password minimal 6 karakter."; ok = false; }
    if (pw !== pw2) { $("#regPassword2Err").textContent = "Konfirmasi password tidak cocok."; ok = false; }
    if (!ok) return;
    const res = registerUser(name, email, pw);
    if (!res.ok) { $("#regEmailErr").textContent = res.error; return; }
    toast("Akun berhasil dibuat. Silakan masuk.", "ok");
    resetAuthForms();
    $("#loginEmail").value = email;
    $("#regName").value = "";
    $("#regEmail").value = "";
    $("#regPassword").value = "";
    $("#regPassword2").value = "";
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = $("#loginEmail").value.trim();
    const pw = $("#loginPassword").value;
    $("#loginEmailErr").textContent = "";
    $("#loginPasswordErr").textContent = "";
    if (!isValidEmail(email)) { $("#loginEmailErr").textContent = "Format email tidak valid."; return; }
    if (!pw) { $("#loginPasswordErr").textContent = "Password wajib diisi."; return; }
    const res = loginUser(email, pw);
    if (!res.ok) {
      $("#loginPasswordErr").textContent = res.error;
      return;
    }
    toast("Selamat datang, " + (currentUser ? currentUser.name : "") + ".", "ok");
    $("#loginEmail").value = "";
    $("#loginPassword").value = "";
    navigate("home");
  }

  /* ---------------- Wiring ---------------- */
  function wireEvents() {
    /* Global click delegation */
    document.addEventListener("click", e => {
      const pageLink = e.target.closest("[data-page]");
      if (pageLink) {
        e.preventDefault();
        navigate(pageLink.dataset.page);
        return;
      }

      const closeBtn = e.target.closest("[data-close]");
      if (closeBtn) { closeModal(closeBtn.dataset.close); return; }

      const addBtn = e.target.closest("[data-add]");
      if (addBtn && !addBtn.disabled) {
        addToCart(Number(addBtn.dataset.add), 1);
        return;
      }

      const openProd = e.target.closest("[data-open-product]");
      if (openProd) { openProductModal(Number(openProd.dataset.openProduct)); return; }

      const cartQty = e.target.closest("[data-cart-qty]");
      if (cartQty) {
        changeQty(Number(cartQty.dataset.cartQty), Number(cartQty.dataset.delta));
        return;
      }

      const cartRemove = e.target.closest("[data-cart-remove]");
      if (cartRemove) { removeItem(Number(cartRemove.dataset.cartRemove)); return; }

      const pageNum = e.target.closest("[data-page-num]");
      if (pageNum && !pageNum.disabled) {
        const n = Number(pageNum.dataset.pageNum);
        if (!isNaN(n) && n >= 1) {
          state.page = n;
          renderProductList();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      const jumpCat = e.target.closest("[data-jump-cat]");
      if (jumpCat) {
        state.cats = new Set([jumpCat.dataset.jumpCat]);
        state.page = 1;
        navigate("products");
        return;
      }

      const addModal = e.target.closest("[data-add-modal]");
      if (addModal) {
        const qtyInput = $("#modalQty");
        const qty = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;
        addToCart(Number(addModal.dataset.addModal), qty);
        closeModal("productModal");
        return;
      }

      const modalQtyBtn = e.target.closest("[data-modal-qty]");
      if (modalQtyBtn) {
        const input = $("#modalQty");
        if (!input) return;
        const delta = Number(modalQtyBtn.dataset.modalQty);
        const max = Number(input.max) || 999;
        let v = Number(input.value) + delta;
        if (v < 1) v = 1;
        if (v > max) v = max;
        input.value = v;
        return;
      }

      const orderBtn = e.target.closest("[data-order-id]");
      if (orderBtn) {
        const all = getOrders();
        const list = all[currentUser ? currentUser.email : ""] || [];
        const o = list.find(x => x.id === orderBtn.dataset.orderId);
        if (o) showInvoice(o);
        return;
      }
    });

    /* Nav buttons */
    $("#themeToggle").addEventListener("click", toggleTheme);
    $("#cartBtn").addEventListener("click", openCart);
    $("#cartClose").addEventListener("click", closeCart);
    $("#cartBackdrop").addEventListener("click", closeCart);

    $("#accountBtn").addEventListener("click", () => {
      navigate(currentUser ? "profile" : "auth");
    });

    $("#gotoAuthBtn").addEventListener("click", () => {
      closeModal("loginRequiredModal");
      navigate("auth");
    });

    /* Auth tabs */
    $$(".auth-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        $$(".auth-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        $$(".auth-form").forEach(f => f.classList.remove("active"));
        const target = tab.dataset.tab === "login" ? "#loginForm" : "#registerForm";
        $(target).classList.add("active");
      });
    });

    $("#loginForm").addEventListener("submit", handleLogin);
    $("#registerForm").addEventListener("submit", handleRegister);

    /* Search */
    const doSearch = debounce(value => {
      state.q = value.trim();
      state.page = 1;
      navigate("products");
    }, 200);
    $("#globalSearch").addEventListener("input", e => doSearch(e.target.value));

    /* Filters */
    const minR = $("#priceMin");
    const maxR = $("#priceMax");
    minR.addEventListener("input", () => {
      if (Number(minR.value) > Number(maxR.value)) minR.value = maxR.value;
      state.minPrice = Number(minR.value);
      state.page = 1;
      $("#priceMinLabel").textContent = formatRupiah(state.minPrice);
      renderProductList();
    });
    maxR.addEventListener("input", () => {
      if (Number(maxR.value) < Number(minR.value)) maxR.value = minR.value;
      state.maxPrice = Number(maxR.value);
      state.page = 1;
      $("#priceMaxLabel").textContent = formatRupiah(state.maxPrice);
      renderProductList();
    });

    $("#sortSelect").addEventListener("change", e => {
      state.sort = e.target.value;
      state.page = 1;
      renderProductList();
    });

    $("#resetFilters").addEventListener("click", () => {
      state.q = "";
      state.cats = new Set();
      state.minPrice = 0;
      state.maxPrice = 80000;
      state.sort = "default";
      state.page = 1;
      $("#globalSearch").value = "";
      minR.value = 0;
      maxR.value = 80000;
      $("#priceMinLabel").textContent = "Rp0";
      $("#priceMaxLabel").textContent = "Rp80.000";
      $("#sortSelect").value = "default";
      renderCatFilters();
      renderProductList();
      toast("Filter direset.", "ok");
    });

    /* Checkout */
    $("#checkoutForm").addEventListener("submit", submitCheckout);
    $("#printInvoice").addEventListener("click", () => window.print());

    /* Escape closes any open surface */
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        closeAllModals();
        closeCart();
      }
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    initTheme();
    products = generateProducts();
    loadCart();
    const session = getSession();
    if (session && session.email) currentUser = session;
    refreshAuthUI();
    updateCartBadge();
    renderCart();
    renderHome();
    wireEvents();

    /* Splash hide */
    setTimeout(() => {
      const s = $("#splash");
      if (s) {
        s.classList.add("hide");
        setTimeout(() => s.remove(), 500);
      }
    }, 1500);

    /* Land on home */
    navigate("home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();