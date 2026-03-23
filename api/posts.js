// Vercel serverless function to list all post JSON files
const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const dir = path.join(process.cwd(), '_data', 'posts');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const posts = files.map(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      return JSON.parse(content);
    });
    res.json(posts);
  } catch (err) {
    res.json([]);
  }
};
