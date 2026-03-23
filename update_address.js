const fs = require('fs');
const path = require('path');

const newAddress = '234 Bình Thới, Phường 10, Quận 11, HCM';
const newMapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.6023249110416!2d106.6432285750239!3d10.7650706893838!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ec17519ca6b%3A0xf81708516c4b9148!2sSTORE%20L%C3%80M%20M%E1%BB%98C!5e0!3m2!1sen!2svn!4v1742747372332!5m2!1sen!2svn';

const files = [
  'index.html',
  'contact.html',
  'products.html',
  'product.html',
  'blog.html',
  'post.html'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Update text address in contact-value or footer span
    // Pattern for contact page: <div class="contact-value">...</div>
    content = content.replace(/<div class="contact-value">TP\. Hồ Chí Minh, Việt Nam<\/div>/g, `<div class="contact-value">${newAddress}</div>`);
    
    // Pattern for footer: <li><span>📍 TP. Hồ Chí Minh</span></li>
    content = content.replace(/<li><span>📍 TP\. Hồ Chí Minh<\/span><\/li>/g, `<li><span>📍 ${newAddress}</span></li>`);
    
    // Fallback for any other "TP. Hồ Chí Minh" in footer-like context
    content = content.replace(/📍 TP\. Hồ Chí Minh/g, `📍 ${newAddress}`);

    // 2. Update Google Maps iframe src
    content = content.replace(/src="https:\/\/www\.google\.com\/maps\/embed\?pb=[^"]+"/g, `src="${newMapUrl}"`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
