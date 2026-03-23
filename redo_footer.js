const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'contact.html',
  'products.html',
  'product.html',
  'blog.html',
  'post.html'
];

const newAddress = '234 Bình Thới, Phường 10, Quận 11, HCM';
const phone = '0938 895 934';
const email = 'info@quangphugroup.com';

const newFooterHTML = `
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="/" class="footer-logo">
            <img src="/images/logo.png" alt="Toyoko Logo">
          </a>
          <p class="footer-desc">
            Công ty TNHH Quang Phú - Nhà sản xuất và phân phối độc quyền thương hiệu Toyoko tại Việt Nam.
          </p>
        </div>
        <div>
          <div class="footer-title">Khám phá</div>
          <ul class="footer-links">
            <li><a href="/">Trang chủ</a></li>
            <li><a href="/products.html">Sản phẩm</a></li>
            <li><a href="/blog.html">Tuyển dụng</a></li>
            <li><a href="/contact.html">Liên hệ</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-title">Liên hệ</div>
          <ul class="footer-contacts">
            <li><a href="tel:0938895934"><span>📞</span> ${phone}</a></li>
            <li><a href="mailto:${email}"><span>✉️</span> ${email}</a></li>
            <li><span>📍</span> ${newAddress}</li>
            <li><span>🕒</span> Thứ 2 – Thứ 7: 7:30 – 17:30</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2024 Công ty TNHH Quang Phú. Tất cả quyền được bảo lưu.</p>
        <p>Thương hiệu Toyoko – An tâm đồng hành cùng thợ Việt</p>
      </div>
    </div>
  </footer>`;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace old footer with new one
    content = content.replace(/<footer>[\s\S]*?<\/footer>/, newFooterHTML.trim());

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Redone footer in ${file}`);
  }
});
