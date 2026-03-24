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
      },
      footer: {
        desc: 'Công ty TNHH Quang Phú - Nhà sản xuất và phân phối độc quyền thương hiệu Toyoko tại Việt Nam.',
        phone: '0938 895 934',
        email: 'info@quangphugroup.com',
        address: '234 Bình Thới, Phường 10, Quận 11, HCM',
        hours: 'T2-T6: 8h-17h, T7: 8h-12h',
        copyright: '© 2024 Công ty TNHH Quang Phú. Tất cả quyền được bảo lưu.',
        tagline: 'Thương hiệu Toyoko – An tâm đồng hành cùng thợ Việt'
      }
    });
  }
};
