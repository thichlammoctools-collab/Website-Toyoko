// functions/api/admin/site.js
import { verifyAuth } from './_auth.js';
import { getFile, putFile } from './_github.js';

function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCORSHeaders(), 'Content-Type': 'application/json' },
  });
}

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
  productCategories: [
    'Máy khoan',
    'Máy mài',
    'Máy cưa',
    'Máy siết bulon/vít',
    'Khác'
  ],
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
  },
  footer: {
    desc: 'Công ty TNHH Quang Phú - Nhà sản xuất và phân phối độc quyền thương hiệu Toyoko tại Việt Nam.',
    phone: '0938 895 934',
    email: 'info@quangphugroup.com',
    address: '234 Bình Thới, Phường 10, Quận 11, HCM',
    hours: 'T2-T6: 8h-17h, T7: 8h-12h',
    exploreTitle: 'Khám phá',
    contactTitle: 'Liên hệ',
    linkHomeText: 'Trang chủ',
    linkProductsText: 'Sản phẩm',
    linkBlogText: 'Tuyển dụng',
    linkContactText: 'Liên hệ',
    copyright: '© 2024 Công ty TNHH Quang Phú. Tất cả quyền được bảo lưu.',
    tagline: 'Thương hiệu Toyoko – An tâm đồng hành cùng thợ Việt'
  }
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCORSHeaders() });
  }

  try {
    await verifyAuth(request, env);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  if (request.method === 'GET') {
    try {
      const file = await getFile('_data/site.json', env);
      if (!file) return jsonResponse({ ok: true, data: DEFAULT_SITE });
      const parsed = JSON.parse(file.content);
      return jsonResponse({
        ok: true,
        data: {
          ...parsed,
          productCategories: normalizeProductCategories(parsed.productCategories || DEFAULT_SITE.productCategories)
        }
      });
    } catch (err) {
      return jsonResponse({ ok: false, error: err.message }, 500);
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const data = body.data || {};
      const existing = await getFile('_data/site.json', env);
      const current = existing ? JSON.parse(existing.content) : DEFAULT_SITE;
      const merged = {
        productCategories: Array.isArray(data.productCategories)
          ? normalizeProductCategories(data.productCategories)
          : normalizeProductCategories(Array.isArray(current.productCategories) ? current.productCategories : DEFAULT_SITE.productCategories),
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
        footer: {
          ...DEFAULT_SITE.footer,
          ...(current.footer || {}),
          ...(data.footer || {}),
        },
      };

      await putFile(
        '_data/site.json',
        JSON.stringify(merged, null, 2),
        'admin: update site content',
        existing ? existing.sha : undefined,
        false,
        env
      );
      return jsonResponse({ ok: true, data: merged });
    } catch (err) {
      return jsonResponse({ ok: false, error: err.message }, 500);
    }
  }

  return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
}
