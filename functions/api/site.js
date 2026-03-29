// functions/api/site.js

function normalizeProductCategories(categories) {
  const seen = new Set();
  const out = [];
  (Array.isArray(categories) ? categories : []).forEach(item => {
    const name = (typeof item === 'string' ? item : (item && item.name)) || '';
    const clean = String(name).trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) return;
    seen.add(key);
    out.push(clean);
  });
  if (!out.some(c => c.toLowerCase() === 'khác')) out.push('Khác');
  return out;
}

const DEFAULT_SITE = {
  productCategories: ['Máy khoan', 'Máy mài', 'Máy cưa', 'Máy siết bulon/vít', 'Khác'],
  hero: { badge: '', titlePrefix: 'TOYOKO', titleRest: '', description: '', image: '/images/hero-machine.png', imageAlt: 'Máy cầm tay Toyoko' },
  about: { sectionLabel: 'Về chúng tôi', title: 'Toyoko – An tâm đồng hành cùng người thợ Việt', description1: '', description2: '', image: '/images/about.jpg', imageAlt: 'Kho hàng Quang Phú', badgeTitle: 'Chứng nhận nhập khẩu', badgeSubtitle: 'Toyoko Official Importer VN', primaryButtonText: 'Xem sản phẩm', primaryButtonHref: '/products.html', secondaryButtonText: 'Liên hệ', secondaryButtonHref: '/contact.html' },
  why: { sectionLabel: 'Tại sao chọn chúng tôi', title: 'Lợi ích khi mua hàng tại Quang Phú', cards: [] },
  footer: { desc: 'Công ty TNHH Quang Phú - Nhà sản xuất và phân phối độc quyền thương hiệu Toyoko tại Việt Nam.', phone: '0938 895 934', email: 'info@quangphugroup.com', address: '234 Bình Thới, Phường 10, Quận 11, HCM', hours: 'T2-T6: 8h-17h, T7: 8h-12h', exploreTitle: 'Khám phá', contactTitle: 'Liên hệ', linkHomeText: 'Trang chủ', linkProductsText: 'Sản phẩm', linkBlogText: 'Tuyển dụng', linkContactText: 'Liên hệ', copyright: '© 2024 Công ty TNHH Quang Phú. Tất cả quyền được bảo lưu.', tagline: 'Thương hiệu Toyoko – An tâm đồng hành cùng thợ Việt' }
};

export async function onRequest(context) {
  const { request, env } = context;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const dataUrl = new URL('/_data/site.json', request.url);
    const assetRes = await env.ASSETS.fetch(new Request(dataUrl));
    
    if (assetRes.ok) {
        const json = await assetRes.json();
        return new Response(JSON.stringify({
            ...json,
            productCategories: normalizeProductCategories(json.productCategories || DEFAULT_SITE.productCategories)
        }), { headers, status: 200 });
    } else {
        throw new Error('Fallback to default');
    }
  } catch (err) {
    return new Response(JSON.stringify(DEFAULT_SITE), { headers, status: 200 });
  }
}
