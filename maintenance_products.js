const fs = require('fs');
const path = require('path');
const dir = '_data/products';

if (!fs.existsSync(dir)) {
    console.error(`Directory ${dir} not found`);
    process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
console.log(`Processing ${files.length} files...`);

files.forEach(f => {
    try {
        const fp = path.join(dir, f);
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        
        let modified = false;

        // 1. Extract SKU from description if it hasn't been extracted yet
        if (!data.sku) {
            const skuMatch = data.description ? data.description.match(/- Mã hàng: (.*)$/i) : null;
            if (skuMatch) {
                data.sku = skuMatch[1].trim();
                data.description = data.description.replace(skuMatch[0], '').trim();
                modified = true;
            }
        }

        // 2. Price calculation (+40%, rounded to nearest 1000)
        // If price is already high, we might have done it before, so only do it if the user RE-REQUESTED it.
        // User RE-REQUESTED: "cập nhật giá sản phẩm hàng loạt cao hơn giá hiện tại 40%"
        const oldPrice = data.price || 0;
        if (oldPrice > 0) {
            data.price = Math.round((oldPrice * 1.4) / 1000) * 1000;
            modified = true;
            console.log(`${f}: ${oldPrice} -> ${data.price}`);
        }

        if (modified) {
            fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
        }

    } catch (err) {
        console.error(`Error processing ${f}: ${err.message}`);
    }
});

console.log('Finished processing products');
