const { verifyAuth } = require('./_auth');
const { getFile, putFile } = require('./_github');

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const DEFAULT_SITE = {
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
    cards: [
      { icon: '🏆', title: 'Chính hãng 100%', description: 'Nhà nhập khẩu trực tiếp từ nhà máy Toyoko, cam kết hàng chính hãng.' },
      { icon: '🚚', title: 'Giao hàng nhanh', description: 'Giao hàng toàn quốc, TP.HCM giao trong ngày.' },
      { icon: '🔧', title: 'Bảo hành chính hãng', description: 'Bảo hành 6 tháng, trung tâm bảo hành chuyên nghiệp.' },
      { icon: '💰', title: 'Giá cạnh tranh', description: 'Nhập thẳng từ nhà máy, giá tốt nhất thị trường.' },
      { icon: '📞', title: 'Hỗ trợ kỹ thuật', description: 'Đội ngũ kỹ thuật tư vấn miễn phí qua Zalo và điện thoại.' },
      { icon: '🤝', title: 'Đại lý chính thức', description: 'Chính sách đại lý hấp dẫn, hỗ trợ trưng bày và marketing.' }
    ]
  }
};

module.exports = async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyAuth(req);
  } catch {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const file = await getFile('_data/site.json');
      if (!file) return res.status(200).json({ ok: true, data: DEFAULT_SITE });
      return res.status(200).json({ ok: true, data: JSON.parse(file.content) });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
      const data = body.data || {};
      const existing = await getFile('_data/site.json');
      const current = existing ? JSON.parse(existing.content) : DEFAULT_SITE;
      const merged = {
        hero: {
          ...DEFAULT_SITE.hero,
          ...(current.hero || {}),
          ...(data.hero || {}),
        },
        about: {
          ...DEFAULT_SITE.about,
          ...(current.about || {}),
          ...(data.about || {}),
        },
        why: {
          ...DEFAULT_SITE.why,
          ...(current.why || {}),
          ...(data.why || {}),
        },
      };

      await putFile(
        '_data/site.json',
        JSON.stringify(merged, null, 2),
        'admin: update site content',
        existing ? existing.sha : undefined
      );
      return res.status(200).json({ ok: true, data: merged });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
