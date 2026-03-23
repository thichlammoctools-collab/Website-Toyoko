const fs = require('fs');
const path = require('path');
const dir = '_data/products';

if (fs.existsSync(dir)) {
  fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
    const fp = path.join(dir, f);
    const p = JSON.parse(fs.readFileSync(fp, 'utf8'));
    
    // Pattern to match SKU in existing descriptions
    const match = p.description ? p.description.match(/- Mã hàng: (.*)$/) : null;
    if (match) {
      p.sku = match[1].trim();
      p.description = p.description.replace(match[0], '').trim();
      fs.writeFileSync(fp, JSON.stringify(p, null, 2), 'utf8');
      console.log(`Add SKU ${p.sku} to ${f}`);
    }
  });
  console.log('Done!');
} else {
  console.log('Directory not found');
}
