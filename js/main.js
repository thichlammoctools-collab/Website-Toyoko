// ─── Helpers ────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmtPrice = p => p > 0
  ? p.toLocaleString('vi-VN') + ' ₫'
  : 'Liên hệ';

// Fetch JSON data – supports both array root and {data:[...]} wrapped
const fetchJSON = url => fetch(url)
  .then(r => r.ok ? r.json() : [])
  .then(json => Array.isArray(json) ? json : (json.data || []))
  .catch(() => []);

// Mark active nav link
function setActiveNav() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  $$('nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    a.classList.toggle('active', path === href || (href !== '/' && path.startsWith(href)));
  });
}

// Mobile nav toggle
function initMobileNav() {
  const hamburger = $('.hamburger');
  const mobileNav = $('.mobile-nav');
  const close = $('.mobile-nav-close');
  if (!hamburger) return;
  hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
  close?.addEventListener('click', () => mobileNav.classList.remove('open'));
}

// ─── Product Card HTML ───────────────────────────────────────────
function productCardHTML(p) {
  const img = p.images?.[0] || '/images/placeholder.jpg';
  const url = `/product.html?slug=${p.slug}`;
  return `
    <a href="${url}" class="product-card">
      <div class="product-card-img">
        <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='/images/placeholder.jpg'">
      </div>
      <div class="product-card-body">
        <div class="product-card-cat">${p.category}</div>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">${fmtPrice(p.price)}</div>
      </div>
    </a>`;
}

// ─── HOME PAGE ───────────────────────────────────────────────────
async function initHome() {
  const featuredEl = $('#featured-products');
  if (!featuredEl) return;
  const products = await fetchJSON('/_data/products.json');
  const visible = products.filter(p => p.visible).slice(0, 6);
  if (visible.length === 0) {
    featuredEl.closest('section')?.remove();
    return;
  }
  featuredEl.innerHTML = visible.map(productCardHTML).join('');
}

// ─── PRODUCTS PAGE ───────────────────────────────────────────────
async function initProducts() {
  const gridEl = $('#products-grid');
  if (!gridEl) return;

  const products = await fetchJSON('/_data/products.json');
  let allProducts = products.filter(p => p.visible);
  let currentCat = 'Tất cả';
  let searchTerm = '';

  // Build category buttons
  const cats = ['Tất cả', ...new Set(allProducts.map(p => p.category))];
  const catEl = $('#categories');
  if (catEl) {
    catEl.innerHTML = cats.map(c =>
      `<button class="cat-btn${c === currentCat ? ' active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    catEl.addEventListener('click', e => {
      if (!e.target.matches('.cat-btn')) return;
      currentCat = e.target.dataset.cat;
      $$('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === currentCat));
      render();
    });
  }

  const searchInput = $('#search-input');
  searchInput?.addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase();
    render();
  });

  function render() {
    const filtered = allProducts.filter(p => {
      const matchCat = currentCat === 'Tất cả' || p.category === currentCat;
      const matchSearch = p.name.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });
    gridEl.innerHTML = filtered.length
      ? filtered.map(productCardHTML).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><h3>Không tìm thấy sản phẩm</h3><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p></div>`;
  }

  render();
}

// ─── PRODUCT DETAIL PAGE ─────────────────────────────────────────
async function initProductDetail() {
  const container = $('#product-detail');
  if (!container) return;

  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { container.innerHTML = '<div class="empty-state"><h3>Không tìm thấy sản phẩm</h3></div>'; return; }

  const products = await fetchJSON('/_data/products.json');
  const p = products.find(prod => prod.slug === slug);
  if (!p) { container.innerHTML = '<div class="empty-state"><h3>Không tìm thấy sản phẩm</h3></div>'; return; }

  document.title = `${p.name} – Toyoko Quang Phú`;

  const images = p.images?.length ? p.images : ['/images/placeholder.jpg'];
  let activeImg = 0;
  const specsHTML = p.specs ? Object.entries(p.specs).map(([k, v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('') : '';
  const thumbsHTML = images.map((img, i) =>
    `<div class="product-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}">
      <img src="${img}" alt="" onerror="this.src='/images/placeholder.jpg'">
    </div>`
  ).join('');

  container.innerHTML = `
    <div class="breadcrumb container">
      <a href="/">Trang chủ</a><span>/</span>
      <a href="/products.html">Sản phẩm</a><span>/</span>
      <span>${p.name}</span>
    </div>
    <div class="product-detail container">
      <div class="product-gallery">
        <div class="main-img">
          <img id="main-img" src="${images[0]}" alt="${p.name}" onerror="this.src='/images/placeholder.jpg'">
        </div>
        <div class="product-thumbs">${thumbsHTML}</div>
      </div>
      <div class="product-info">
        <div class="product-info-cat">${p.category}</div>
        <h1 class="product-info-name">${p.name}</h1>
        <div class="product-info-price">${fmtPrice(p.price)}</div>
        <p class="product-info-desc">${p.description || ''}</p>
        ${specsHTML ? `<table class="specs-table"><tbody>${specsHTML}</tbody></table>` : ''}
        <div class="product-ctas">
          <a href="/contact.html?product=${encodeURIComponent(p.name)}" class="btn btn-primary">📞 Liên hệ đặt hàng</a>
          <a href="https://zalo.me/0901234567" target="_blank" class="btn btn-outline">💬 Chat Zalo</a>
        </div>
      </div>
    </div>`;

  // Thumbnail switching
  $$('.product-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      activeImg = +thumb.dataset.idx;
      $('#main-img').src = images[activeImg];
      $$('.product-thumb').forEach((t, i) => t.classList.toggle('active', i === activeImg));
    });
  });
}

// ─── BLOG PAGE ───────────────────────────────────────────────────
async function initBlog() {
  const listEl = $('#post-list');
  if (!listEl) return;

  const posts = await fetchJSON('/_data/posts.json');
  const visible = posts.filter(p => p.visible);
  if (!visible.length) {
    listEl.innerHTML = '<div class="empty-state"><h3>Hiện chưa có thông báo tuyển dụng</h3><p>Vui lòng quay lại sau hoặc liên hệ trực tiếp công ty.</p></div>';
    return;
  }
  listEl.innerHTML = visible.map(p => {
    const d = new Date(p.date);
    const day = d.getDate().toString().padStart(2, '0');
    const mon = d.toLocaleDateString('vi-VN', { month: 'short' });
    return `
      <a href="/post.html?slug=${p.slug}" class="post-card">
        <div class="post-date">
          <span class="post-date-day">${day}</span>
          <span class="post-date-mon">${mon}</span>
        </div>
        <div>
          <div class="post-title">${p.title}</div>
          <div class="post-excerpt">${p.excerpt}</div>
          <div class="post-read-more">Xem chi tiết →</div>
        </div>
      </a>`;
  }).join('');
}

// ─── POST DETAIL PAGE ────────────────────────────────────────────
async function initPost() {
  const heroEl = $('#post-hero');
  const bodyEl = $('#post-body');
  if (!heroEl || !bodyEl) return;

  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { bodyEl.innerHTML = '<div class="empty-state"><h3>Không tìm thấy bài viết</h3></div>'; return; }

  const posts = await fetchJSON('/_data/posts.json');
  const p = posts.find(post => post.slug === slug);
  if (!p) { bodyEl.innerHTML = '<div class="empty-state"><h3>Không tìm thấy bài viết</h3></div>'; return; }

  document.title = `${p.title} – Toyoko Quang Phú`;
  const date = new Date(p.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  heroEl.innerHTML = `
    <div class="container">
      <h1>${p.title}</h1>
      <div class="post-meta">📅 ${date}</div>
    </div>`;

  // Simple markdown→HTML conversion
  let html = p.content
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .split('\n\n').map(block => {
      if (block.startsWith('<h') || block.startsWith('<ul')) return block;
      return `<p>${block.trim()}</p>`;
    }).join('\n');
  bodyEl.innerHTML = html;
}

// ─── CONTACT PAGE ────────────────────────────────────────────────
function initContact() {
  const form = $('#contact-form');
  if (!form) return;

  // Pre-fill product from URL param
  const productParam = new URLSearchParams(location.search).get('product');
  if (productParam) {
    const msgField = form.querySelector('[name="message"]');
    if (msgField) msgField.value = `Tôi muốn hỏi về sản phẩm: ${decodeURIComponent(productParam)}`;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    // Replace with your actual form endpoint (e.g., Formspree)
    alert(`Cảm ơn ${data.name}! Chúng tôi sẽ liên hệ lại sớm.`);
    form.reset();
  });
}

// ─── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initMobileNav();
  initHome();
  initProducts();
  initProductDetail();
  initBlog();
  initPost();
  initContact();
});
