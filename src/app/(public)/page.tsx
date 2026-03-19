import Image from 'next/image'
import Link from 'next/link'
import { getProducts } from '@/lib/db'
import ProductCard from '@/components/ProductCard'
import styles from './page.module.css'

export const revalidate = 60

export default async function HomePage() {
  const allProducts = await getProducts(true).catch(() => [])
  const featured = allProducts.slice(0, 6)

  const stats = [
    { value: '10+', label: 'Năm kinh nghiệm' },
    { value: '100+', label: 'Mẫu sản phẩm' },
    { value: '5.000+', label: 'Khách hàng' },
    { value: '12 tháng', label: 'Bảo hành' },
  ]

  const whys = [
    { icon: '🏆', title: 'Chính hãng 100%', desc: 'Nhà nhập khẩu trực tiếp từ nhà máy Toyoko, cam kết hàng chính hãng.' },
    { icon: '🚚', title: 'Giao hàng nhanh', desc: 'Giao hàng toàn quốc, TP.HCM giao trong ngày.' },
    { icon: '🔧', title: 'Bảo hành chính hãng', desc: 'Bảo hành 12 tháng, trung tâm bảo hành chuyên nghiệp.' },
    { icon: '💰', title: 'Giá cạnh tranh', desc: 'Nhập thẳng từ nhà máy, giá tốt nhất thị trường.' },
    { icon: '📞', title: 'Hỗ trợ kỹ thuật', desc: 'Đội ngũ kỹ thuật tư vấn miễn phí qua Zalo & điện thoại.' },
    { icon: '🤝', title: 'Đại lý chính thức', desc: 'Chính sách đại lý hấp dẫn, hỗ trợ trưng bày & marketing.' },
  ]

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroLeft}>
            <span className={styles.heroBadge}>🇻🇳 Nhà nhập khẩu chính thức tại Việt Nam</span>
            <h1 className={styles.heroTitle}>
              Máy cầm tay<br />
              <span className={styles.heroAccent}>TOYOKO</span><br />
              Chính hãng
            </h1>
            <p className={styles.heroDesc}>
              Quang Phú phân phối toàn dòng máy cầm tay điện Toyoko – bền bỉ, mạnh mẽ, giá tốt. Bảo hành 12 tháng chính hãng.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/products" className="btn btn-white">Xem sản phẩm</Link>
              <Link href="/contact" className={`btn ${styles.btnOutlineWhite}`}>Liên hệ ngay</Link>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroImgBox}>
              <Image src="/images/hero-machine.png" alt="Máy cầm tay Toyoko" fill style={{ objectFit: 'contain' }} priority sizes="500px" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map(s => (
              <div key={s.label} className={styles.statItem}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ────────────────────────────────────────── */}
      <section className="section" id="about">
        <div className="container">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutImg}>
              <div className={styles.aboutImgBox}>
                <Image src="/images/about.jpg" alt="Kho hàng Quang Phú" fill style={{ objectFit: 'cover' }} sizes="600px" />
              </div>
              <div className={styles.aboutBadgeCard}>
                <span className={styles.aboutBadgeIcon}>✅</span>
                <div>
                  <strong>Chứng nhận nhập khẩu</strong>
                  <p>Toyoko Official Importer VN</p>
                </div>
              </div>
            </div>
            <div className={styles.aboutText}>
              <span className="section-label">Về chúng tôi</span>
              <h2 className="section-title">Hơn 10 năm đồng hành cùng người thợ Việt</h2>
              <div className="divider-red" />
              <p className="section-subtitle">
                Công ty TNHH Quang Phú được thành lập từ năm 2013, chuyên nhập khẩu và phân phối
                máy cầm tay điện thương hiệu <strong>Toyoko</strong> – thương hiệu công cụ điện uy tín đến từ Nhật Bản.
              </p>
              <p style={{ marginTop: 16, color: 'var(--gray)', lineHeight: 1.8 }}>
                Với hệ thống đại lý phủ khắp 63 tỉnh thành, Quang Phú tự hào là đối tác tin cậy của hàng nghìn
                thợ cơ khí, xưởng sản xuất và nhà thầu xây dựng trên toàn quốc.
              </p>
              <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
                <Link href="/products" className="btn btn-primary">Xem sản phẩm</Link>
                <Link href="/contact" className="btn btn-outline">Liên hệ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ────────────────────────────── */}
      {featured.length > 0 && (
        <section className={`section ${styles.productsSection}`}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <span className="section-label">Sản phẩm</span>
                <h2 className="section-title">Sản phẩm nổi bật</h2>
              </div>
              <Link href="/products" className="btn btn-outline">Xem tất cả →</Link>
            </div>
            <div className="grid-3">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── WHY US ───────────────────────────────────────── */}
      <section className={`section ${styles.whySection}`}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="section-label">Tại sao chọn chúng tôi</span>
            <h2 className="section-title">Lợi ích khi mua hàng tại Quang Phú</h2>
          </div>
          <div className="grid-3">
            {whys.map(w => (
              <div key={w.title} className={styles.whyCard}>
                <span className={styles.whyIcon}>{w.icon}</span>
                <h3 className={styles.whyTitle}>{w.title}</h3>
                <p className={styles.whyDesc}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────── */}
      <section className={styles.ctaSec}>
        <div className="container">
          <div className={styles.ctaBox}>
            <div>
              <h2 className={styles.ctaTitle}>Trở thành đại lý Toyoko tại khu vực của bạn</h2>
              <p className={styles.ctaDesc}>Chính sách đại lý hấp dẫn, hỗ trợ trưng bày, marketing, đào tạo kỹ thuật miễn phí.</p>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-white">Liên hệ ngay</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
