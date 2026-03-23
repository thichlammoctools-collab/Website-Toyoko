const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'contact.html',
  'products.html',
  'product.html',
  'blog.html',
  'post.html',
  'js/main.js'
];

const oldPhone = '0901234567';
const newPhone = '0938895934';
const oldPhoneFmt = '0901 234 567';
const newPhoneFmt = '0938 895 934';

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. tel: links
    content = content.replace(new RegExp(`tel:${oldPhone}`, 'g'), `tel:${newPhone}`);

    // 2. zalo.me links
    content = content.replace(new RegExp(`zalo\\.me/${oldPhone}`, 'g'), `zalo\\.me/${newPhone}`);

    // 3. Formatted phone numbers
    content = content.replace(new RegExp(oldPhoneFmt, 'g'), newPhoneFmt);
    content = content.replace(new RegExp(oldPhone, 'g'), newPhoneFmt); // Fallback for unformatted but raw numbers in text

    // 4. Update Zalo link in QR code (if data parameter is used in URL)
    content = content.replace(new RegExp(`data=https%3A%2F%2Fzalo\\.me%2F${oldPhone}`, 'g'), `data=https%3A%2F%2Fzalo\\.me%2F${newPhone}`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
