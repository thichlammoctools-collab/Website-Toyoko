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

const zaloUrl = 'https://zalo.me/0901234567';
const phone = '0901234567';

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove nav-cta button from <nav>
    content = content.replace(/<a href="\/contact\.html" class="nav-cta">[\s\S]*?<\/a>/g, '');

    // 2. Remove nav-cta even if it's slightly different (fallback)
    content = content.replace(/<a href="\/contact\.html" class="nav-cta">.*?<\/a>/g, '');

    // 3. Update floating widgets (stack Call and Zalo)
    // Find either .zalo-chat or .floating-widgets and replace/update
    const floatingHTML = `
  <div class="floating-widgets">
    <a href="tel:${phone}" class="call-btn">
      <span class="icon">📞</span>
      Gọi ngay
    </a>
    <a href="${zaloUrl}" target="_blank" rel="noopener" class="zalo-btn">
      <img src="/images/zalo-icon.png" alt="Zalo" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/48px-Icon_of_Zalo.svg.png'">
      Chat Zalo
    </a>
  </div>`;

    if (content.includes('<div class="zalo-chat">')) {
        content = content.replace(/<div class="zalo-chat">[\s\S]*?<\/div>/, floatingHTML);
    } else if (content.includes('<div class="floating-widgets">')) {
        content = content.replace(/<div class="floating-widgets">[\s\S]*?<\/div>/, floatingHTML);
    } else {
        // Add if not present (before </body>)
        content = content.replace('</body>', floatingHTML + '\n</body>');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
