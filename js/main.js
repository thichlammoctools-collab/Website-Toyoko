// ─── Helpers ────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmtPrice = p => p > 0
  ? p.toLocaleString('vi-VN') + ' ₫'
  : 'Liên hệ';

const slugify = (str = '') => String(str)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

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
        ${p.sku ? `<div class="product-card-sku">SKU: ${p.sku}</div>` : ''}
        <div class="product-card-price">${fmtPrice(p.price)}</div>
      </div>
    </a>`;
}

// ─── HOME PAGE ───────────────────────────────────────────────────
async function initHome() {
  let site = null;

  // Inject hero content from site settings when homepage elements exist
  const heroBadge = $('#hero-badge');
  if (heroBadge) {
    try {
      site = await fetch('/api/site').then(r => (r.ok ? r.json() : null)).catch(() => null);
      const hero = site?.hero || {};
      const titlePrefixEl = $('#hero-title-prefix');
      const titleRestEl = $('#hero-title-rest');
      const descEl = $('#hero-desc');
      const imageEl = $('#hero-image');

      if (hero.badge) heroBadge.textContent = hero.badge;
      if (hero.titlePrefix && titlePrefixEl) titlePrefixEl.textContent = hero.titlePrefix;
      if (hero.titleRest && titleRestEl) titleRestEl.innerHTML = hero.titleRest.replace(/\n/g, '<br>');
      if (hero.description && descEl) descEl.innerHTML = hero.description.replace(/\n/g, '<br>');
      if (hero.image && imageEl) imageEl.src = hero.image;
      if (hero.imageAlt && imageEl) imageEl.alt = hero.imageAlt;
    } catch {
      // Keep fallback static content if API is unavailable
    }
  }

  // Inject about section content from site settings
  const aboutTitle = $('#about-title');
  if (aboutTitle) {
    try {
      if (!site) {
        site = await fetch('/api/site').then(r => (r.ok ? r.json() : null)).catch(() => null);
      }
      const about = site?.about || {};
      const aboutLabelEl = $('#about-section-label');
      const aboutDesc1El = $('#about-desc-1');
      const aboutDesc2El = $('#about-desc-2');
      const aboutImageEl = $('#about-image');
      const aboutBadgeTitleEl = $('#about-badge-title');
      const aboutBadgeSubtitleEl = $('#about-badge-subtitle');
      const aboutPrimaryBtnEl = $('#about-btn-primary');
      const aboutSecondaryBtnEl = $('#about-btn-secondary');

      if (about.sectionLabel && aboutLabelEl) aboutLabelEl.textContent = about.sectionLabel;
      if (about.title) aboutTitle.textContent = about.title;
      if (about.description1 && aboutDesc1El) aboutDesc1El.innerHTML = about.description1.replace(/\n/g, '<br>');
      if (about.description2 && aboutDesc2El) aboutDesc2El.innerHTML = about.description2.replace(/\n/g, '<br>');
      if (about.image && aboutImageEl) aboutImageEl.src = about.image;
      if (about.imageAlt && aboutImageEl) aboutImageEl.alt = about.imageAlt;
      if (about.badgeTitle && aboutBadgeTitleEl) aboutBadgeTitleEl.textContent = about.badgeTitle;
      if (about.badgeSubtitle && aboutBadgeSubtitleEl) aboutBadgeSubtitleEl.textContent = about.badgeSubtitle;
      if (about.primaryButtonText && aboutPrimaryBtnEl) aboutPrimaryBtnEl.textContent = about.primaryButtonText;
      if (about.primaryButtonHref && aboutPrimaryBtnEl) aboutPrimaryBtnEl.href = about.primaryButtonHref;
      if (about.secondaryButtonText && aboutSecondaryBtnEl) aboutSecondaryBtnEl.textContent = about.secondaryButtonText;
      if (about.secondaryButtonHref && aboutSecondaryBtnEl) aboutSecondaryBtnEl.href = about.secondaryButtonHref;
    } catch {
      // Keep fallback static content if API is unavailable
    }
  }

  // Inject why section content from site settings
  const whyGridEl = $('#why-grid');
  if (whyGridEl) {
    try {
      if (!site) {
        site = await fetch('/api/site').then(r => (r.ok ? r.json() : null)).catch(() => null);
      }
      const why = site?.why || {};
      const whySectionLabelEl = $('#why-section-label');
      const whySectionTitleEl = $('#why-section-title');

      if (why.sectionLabel && whySectionLabelEl) whySectionLabelEl.textContent = why.sectionLabel;
      if (why.title && whySectionTitleEl) whySectionTitleEl.textContent = why.title;

      const cards = Array.isArray(why.cards) ? why.cards.filter(c => c && (c.title || c.description)) : [];
      if (cards.length) {
        whyGridEl.innerHTML = cards.map(card => `
          <div class="why-card">
            <span class="why-icon">${card.icon || '✨'}</span>
            <h3 class="why-title">${card.title || ''}</h3>
            <p class="why-desc">${(card.description || '').replace(/\n/g, '<br>')}</p>
          </div>
        `).join('');
      }
    } catch {
      // Keep fallback static content if API is unavailable
    }
  }

  const featuredEl = $('#featured-products');
  if (!featuredEl) return;
  const products = await fetchJSON('/api/products');
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

  try {
    const [products, site] = await Promise.all([
      fetchJSON('/api/products'),
      fetch('/api/site').then(r => (r.ok ? r.json() : null)).catch(() => null)
    ]);
    let allProducts = products.filter(p => p.visible);
    let currentCat = 'Tất cả';
    let searchTerm = '';
    const initialCatSlug = new URLSearchParams(location.search).get('cat') || '';

    // Build category buttons
    const configuredCats = Array.isArray(site?.productCategories)
      ? site.productCategories.map(c => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
      : [];
    const liveCats = allProducts.map(p => p.category).filter(Boolean);
    const cats = ['Tất cả', ...new Set([...configuredCats, ...liveCats])];
    const catSlugMap = Object.fromEntries(cats.map(name => [slugify(name), name]));
    const initialCatSlugNormalized = slugify(initialCatSlug || '');
    if (initialCatSlug && catSlugMap[initialCatSlugNormalized]) {
      currentCat = catSlugMap[initialCatSlugNormalized];
    }

    function syncCategoryQuery() {
      const url = new URL(location.href);
      if (currentCat === 'Tất cả') url.searchParams.delete('cat');
      else url.searchParams.set('cat', slugify(currentCat));
      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const curPath = `${location.pathname}${location.search}${location.hash}`;
      if (nextPath !== curPath) {
        history.replaceState(null, '', nextPath);
      }
    }

    if (initialCatSlug) {
      syncCategoryQuery();
    }

    const catEl = $('#categories');
    if (catEl) {
      catEl.innerHTML = cats.map(c =>
        `<button class="cat-btn${c === currentCat ? ' active' : ''}" data-cat="${c}">${c}</button>`
      ).join('');
      catEl.addEventListener('click', e => {
        if (!e.target.matches('.cat-btn')) return;
        currentCat = e.target.dataset.cat;
        $$('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === currentCat));
        syncCategoryQuery();
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
        const name = String(p.name || '').toLowerCase();
        const desc = String(p.description || '').toLowerCase();
        const matchSearch = name.includes(searchTerm) || desc.includes(searchTerm);
        return matchCat && matchSearch;
      });
      gridEl.innerHTML = filtered.length
        ? filtered.map(productCardHTML).join('')
        : `<div class="empty-state" style="grid-column:1/-1"><h3>Không tìm thấy sản phẩm</h3><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p></div>`;
    }

    render();
  } catch (err) {
    console.error('[initProducts] Failed to load/render products:', err);
    gridEl.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>Không thể tải sản phẩm</h3><p>Vui lòng thử tải lại trang sau vài giây.</p></div>';
  }
}

// ─── PRODUCT DETAIL PAGE ─────────────────────────────────────────
function formatProductDescription(text) {
  if (!text) return '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let html = '';
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let isRow = false;
    let k = '', v = '';

    if (line.includes('\t')) {
      const parts = line.split('\t').filter(Boolean);
      if (parts.length >= 2) {
        k = parts[0].trim(); v = parts.slice(1).join(' ').trim(); isRow = true;
      }
    } else if (line.match(/\s{2,}/)) {
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 2) {
        k = parts[0].trim(); v = parts.slice(1).join(' ').trim(); isRow = true;
      }
    } else if (line.indexOf(':') > 0 && !line.endsWith(':') && line.length < 150) {
      const idx = line.indexOf(':');
      k = line.substring(0, idx).trim();
      v = line.substring(idx + 1).trim();
      if (k && v) isRow = true;
    }

    if (isRow) {
      if (!inTable) { html += '<table class="specs-table" style="margin-top:10px"><tbody>'; inTable = true; }
      html += `<tr><td>${k}</td><td>${v}</td></tr>`;
    } else {
      if (inTable) { html += '</tbody></table>'; inTable = false; }
      if (line.endsWith(':')) {
        html += `<h3 style="font-size:16px; margin-top:24px; margin-bottom:12px;">${line}</h3>`;
      } else {
        html += `<p style="margin-bottom:8px; line-height:1.6;">${line}</p>`;
      }
    }
  }
  if (inTable) html += '</tbody></table>';
  return html;
}

async function initProductDetail() {
  const container = $('#product-detail');
  if (!container) return;

  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { container.innerHTML = '<div class="empty-state"><h3>Không tìm thấy sản phẩm</h3></div>'; return; }

  const products = await fetchJSON('/api/products');
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
        ${p.sku ? `<div class="product-info-sku">Mã hàng (SKU): <strong>${p.sku}</strong></div>` : ''}
        <div class="product-info-price">${fmtPrice(p.price)}</div>
        <div class="product-info-desc">${formatProductDescription(p.description)}</div>
        ${specsHTML ? `<table class="specs-table" style="margin-top:10px"><tbody>${specsHTML}</tbody></table>` : ''}
        <div class="product-ctas">
          <a href="/contact.html?product=${encodeURIComponent(p.name)}" class="btn btn-primary">📞 Liên hệ đặt hàng</a>
          <a href="https://zalo\.me/0938895934" target="_blank" class="btn btn-outline">💬 Chat Zalo</a>
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

  const posts = await fetchJSON('/api/posts');
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

  const posts = await fetchJSON('/api/posts');
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

// ─── FOOTER (all pages) ─────────────────────────────────────────
async function initFooter() {
  const phoneEl = $('#footer-phone');
  if (!phoneEl) return;
  try {
    const site = await fetch('/api/site').then(r => r.ok ? r.json() : null).catch(() => null);
    const f = site?.footer || {};
    const descEl      = $('#footer-desc');
    const exploreTitleEl = $('#footer-explore-title');
    const contactTitleEl = $('#footer-contact-title');
    const linkHomeEl = $('#footer-link-home-text');
    const linkProductsEl = $('#footer-link-products-text');
    const linkBlogEl = $('#footer-link-blog-text');
    const linkContactEl = $('#footer-link-contact-text');
    const emailEl     = $('#footer-email');
    const addressEl   = $('#footer-address');
    const hoursEl     = $('#footer-hours');
    const copyrightEl = $('#footer-copyright');
    const taglineEl   = $('#footer-tagline');
    if (f.desc && descEl) descEl.innerHTML = f.desc;
    if (f.exploreTitle && exploreTitleEl) exploreTitleEl.textContent = f.exploreTitle;
    if (f.contactTitle && contactTitleEl) contactTitleEl.textContent = f.contactTitle;
    if (f.linkHomeText && linkHomeEl) linkHomeEl.textContent = f.linkHomeText;
    if (f.linkProductsText && linkProductsEl) linkProductsEl.textContent = f.linkProductsText;
    if (f.linkBlogText && linkBlogEl) linkBlogEl.textContent = f.linkBlogText;
    if (f.linkContactText && linkContactEl) linkContactEl.textContent = f.linkContactText;
    if (f.phone) {
      phoneEl.href = 'tel:' + f.phone.replace(/\s/g, '');
      phoneEl.innerHTML = '<span>📞</span> ' + f.phone;
    }
    if (f.email && emailEl) {
      emailEl.href = 'mailto:' + f.email;
      emailEl.innerHTML = '<span>✉️</span> ' + f.email;
    }
    if (f.address && addressEl) addressEl.textContent = f.address;
    if (f.hours && hoursEl) hoursEl.textContent = f.hours;
    if (f.copyright && copyrightEl) copyrightEl.innerHTML = f.copyright;
    if (f.tagline && taglineEl) taglineEl.innerHTML = f.tagline;
  } catch {
    // keep static fallback
  }
}

// ─── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initMobileNav();
  initFooter();
  initHome();
  initProducts();
  initProductDetail();
  initBlog();
  initPost();
  initContact();
});
