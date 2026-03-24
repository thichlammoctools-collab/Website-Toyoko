const fs = require('fs');
const path = require('path');

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

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const filePath = path.join(process.cwd(), '_data', 'site.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    return res.status(200).json({
      ...json,
      productCategories: normalizeProductCategories(json.productCategories || ['Máy khoan', 'Máy mài', 'Máy cưa', 'Máy siết bulon/vít', 'Khác'])
    });
  } catch {
    return res.status(200).json({
      productCategories: ['Máy khoan', 'Máy mài', 'Máy cưa', 'Máy siết bulon/vít', 'Khác'],
      hero: {
        badge: '',
        titlePrefix: 'TOYOKO',
        titleRest: '',
        description: '',
        image: '/images/hero-machine.png',
        imageAlt: 'Máy cầm tay Toyoko'
      },
      about: {
        sectionLabel: 'Về chúng tôi',
        title: 'Toyoko – An tâm đồng hành cùng người thợ Việt',
        description1: '',
        description2: '',
        image: '/images/about.jpg',
        imageAlt: 'Kho hàng Quang Phú',
        badgeTitle: 'Chứng nhận nhập khẩu',
        badgeSubtitle: 'Toyoko Official Importer VN',
        primaryButtonText: 'Xem sản phẩm',
        primaryButtonHref: '/products.html',
        secondaryButtonText: 'Liên hệ',
        secondaryButtonHref: '/contact.html'
      },
      why: {
        sectionLabel: 'Tại sao chọn chúng tôi',
        title: 'Lợi ích khi mua hàng tại Quang Phú',
        cards: []
      }
    });
  }
};
