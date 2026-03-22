import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logoText}>QUANG PHÚ</div>
            <p className={styles.tagline}><strong>Toyoko – An tâm đồng hành</strong><br />Nhà sản xuất & phân phối máy cầm tay Toyoko chính hãng, chất lượng, bền bỉ, giá phải chăng cho thợ thầy Việt Nam.<br/>Hơn 400 đại lý toàn quốc. Giao hàng nhanh, bảo hành gọn lẹ, phục vụ tận tình.</p>
            <div className={styles.socials}>
              <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" className={styles.social} aria-label="Zalo">
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#0068FF"/><text x="20" y="27" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Z</text></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.social} aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className={styles.col_title}>Điều hướng</h3>
            <ul className={styles.links}>
              <li><Link href="/">Trang chủ</Link></li>
              <li><Link href="/products">Sản phẩm</Link></li>
              <li><Link href="/blog">Tuyển dụng</Link></li>
              <li><Link href="/contact">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className={styles.col_title}>Danh mục sản phẩm</h3>
            <ul className={styles.links}>
              <li><Link href="/products?category=Máy khoan">Máy khoan</Link></li>
              <li><Link href="/products?category=Máy mài">Máy mài</Link></li>
              <li><Link href="/products?category=Máy cưa">Máy cưa</Link></li>
              <li><Link href="/products?category=Khác">Khác</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={styles.col_title}>Liên hệ</h3>
            <ul className={styles.contact_list}>
              <li>
                <span className={styles.icon}>📍</span>
                <span>123 Đường Lý Thường Kiệt, Q.10, TP.HCM</span>
              </li>
              <li>
                <span className={styles.icon}>📞</span>
                <a href="tel:0901234567">0901 234 567</a>
              </li>
              <li>
                <span className={styles.icon}>✉️</span>
                <a href="mailto:info@quangphu.vn">info@quangphu.vn</a>
              </li>
              <li>
                <span className={styles.icon}>⏰</span>
                <span>T2–T7: 8:00 – 17:30</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Công ty TNHH Quang Phú. Nhà nhập khẩu & phân phối độc quyền máy Toyoko tại Việt Nam.</p>
        </div>
      </div>
    </footer>
  )
}
