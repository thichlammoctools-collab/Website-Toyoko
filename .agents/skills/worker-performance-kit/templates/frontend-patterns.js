// frontend-patterns.js
// Best practices for rapid data fetching and local caching

/**
 * Parallel Data Fetching
 * Use Promise.all to fetch multiple resources simultaneously.
 */
async function loadHomeData() {
  const [site, products] = await Promise.all([
    fetch('/api/site').then(r => r.json()),
    fetch('/api/products').then(r => r.json())
  ]).catch(err => {
    console.error('Fetch error:', err);
    return [null, []];
  });
  return { site, products };
}

/**
 * Passive Session Caching
 * Store non-sensitive configuration in sessionStorage for millisecond revisit speed.
 */
async function getCachedSite() {
  const key = 'toyoko_site_cfg';
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);
  
  const site = await fetch('/api/site').then(r => r.json());
  sessionStorage.setItem(key, JSON.stringify(site));
  return site;
}

/**
 * Parallel Image Loading
 * Don't wait for images to load before rendering UI.
 */
function renderProduct(p) {
  const img = new Image();
  img.src = p.image; // Starts background load
  // Return HTML structure immediately
  return `<div><img src="${p.image}" loading="lazy">...</div>`;
}

export { loadHomeData, getCachedSite, renderProduct };
