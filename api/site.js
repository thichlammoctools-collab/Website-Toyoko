const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const filePath = path.join(process.cwd(), '_data', 'site.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    return res.status(200).json(json);
  } catch {
    return res.status(200).json({
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
      }
    });
  }
};
