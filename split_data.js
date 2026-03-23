// Script to split products.json into individual files
const fs = require('fs');
const path = require('path');

const productsFile = path.join(__dirname, '_data', 'products.json');
const productsDir = path.join(__dirname, '_data', 'products');
const postsFile = path.join(__dirname, '_data', 'posts.json');
const postsDir = path.join(__dirname, '_data', 'posts');

// Create folders
if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });
if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

// Split products
const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
const productsList = products.data || products;
productsList.forEach(p => {
  const filename = (p.slug || p.id) + '.json';
  fs.writeFileSync(path.join(productsDir, filename), JSON.stringify(p, null, 2), 'utf8');
});
console.log(`Created ${productsList.length} product files in _data/products/`);

// Split posts
const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
const postsList = posts.data || posts;
postsList.forEach(p => {
  const filename = (p.slug || p.id) + '.json';
  fs.writeFileSync(path.join(postsDir, filename), JSON.stringify(p, null, 2), 'utf8');
});
console.log(`Created ${postsList.length} post files in _data/posts/`);

console.log('Done! Now update main.js to read from folder.');
