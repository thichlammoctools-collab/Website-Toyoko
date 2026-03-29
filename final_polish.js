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

const logoHTML = '<a href="/" class="logo"><img src="/images/logo.png" alt="Toyoko Logo"></a>';
const footerLogoHTML = '<div class="footer-logo"><img src="/images/logo.png" alt="Toyoko Logo" style="height:40px"></div>';
// Use local zalo-icon.png we copied earlier
const zaloIconPath = '/images/zalo-icon.png';
const zaloUrl = 'https://zalo.me/0938895934';

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update Header Logo
    content = content.replace(/<a href="\/" class="logo">[\s\S]*?<\/a>/, logoHTML);

    // 2. Update Footer Logo
    content = content.replace(/<div class="footer-logo">[\s\S]*?<\/div>/, footerLogoHTML);

    // 3. Fix Zalo Floating Widget Icon (use local file)
    content = content.replace(/<div class="zalo-chat">[\s\S]*?<\/div>/, `
  <div class="zalo-chat">
    <a href="${zaloUrl}" target="_blank" rel="noopener" class="zalo-btn">
      <img src="${zaloIconPath}" alt="Zalo" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/48px-Icon_of_Zalo.svg.png'">
      Chat Zalo
    </a>
  </div>`);

    // 4. Specifically for contact.html: Replace form with QR
    if (file === 'contact.html') {
      const qrSection = `
          <div class="contact-qr-container">
            <h3>Quét mã Zalo đặt hàng</h3>
            <p>Sử dụng ứng dụng Zalo để quét mã và nhắn tin trực tiếp cho đội ngũ tư vấn.</p>
            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(zaloUrl)}" alt="Zalo QR Code">
            </div>
            <a href="${zaloUrl}" target="_blank" class="qr-zalo-btn">
              💬 Nhắn tin qua Zalo
            </a>
          </div>`;
      
      content = content.replace(/<div class="contact-form">[\s\S]*?<\/div>[\s\S]*?<\/div>/, qrSection);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
