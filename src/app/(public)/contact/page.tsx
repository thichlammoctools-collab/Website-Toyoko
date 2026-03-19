import styles from './page.module.css'

export default function ContactPage() {
  return (
    <div>
      <div className={styles.header}>
        <div className="container">
          <span className="section-label">Liên hệ</span>
          <h1 className="section-title" style={{ color: 'white' }}>Thông tin liên hệ</h1>
        </div>
      </div>

      <div className="container section">
        <div className={styles.grid}>
          {/* Contact Cards */}
          <div className={styles.info}>
            <h2 className={styles.infoTitle}>Công ty TNHH Quang Phú</h2>
            <p className={styles.infoSubtitle}>Nhà nhập khẩu & phân phối máy cầm tay Toyoko tại Việt Nam</p>

            <div className={styles.cards}>
              <div className={styles.contactCard}>
                <div className={styles.cardIcon}>📍</div>
                <div>
                  <strong>Địa chỉ</strong>
                  <p>123 Đường Lý Thường Kiệt, Phường 7, Quận 10, TP.HCM</p>
                </div>
              </div>
              <div className={styles.contactCard}>
                <div className={styles.cardIcon}>📞</div>
                <div>
                  <strong>Điện thoại</strong>
                  <p><a href="tel:0901234567">0901 234 567</a></p>
                  <p><a href="tel:0281234567">028 1234 567</a></p>
                </div>
              </div>
              <div className={styles.contactCard}>
                <div className={styles.cardIcon}>✉️</div>
                <div>
                  <strong>Email</strong>
                  <p><a href="mailto:info@quangphu.vn">info@quangphu.vn</a></p>
                </div>
              </div>
              <div className={styles.contactCard}>
                <div className={styles.cardIcon}>⏰</div>
                <div>
                  <strong>Giờ làm việc</strong>
                  <p>Thứ 2 – Thứ 7: 8:00 – 17:30</p>
                  <p>Chủ nhật: Nghỉ</p>
                </div>
              </div>
            </div>

            <div className={styles.quickContact}>
              <a href="tel:0901234567" className="btn btn-primary">📞 Gọi ngay</a>
              <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                💬 Chat Zalo
              </a>
            </div>
          </div>

          {/* Map embed */}
          <div className={styles.mapBox}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.1547648826166!2d106.6539!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzM3LjAiTiAxMDbCsDM5JzE0LjAiRQ!5e0!3m2!1svi!2svn!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: 'var(--radius-lg)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bản đồ Quang Phú"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
