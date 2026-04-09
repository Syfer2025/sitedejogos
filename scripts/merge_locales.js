const fs = require('fs');

const pt = JSON.parse(fs.readFileSync('src/messages/pt-BR.json', 'utf8'));

const files = fs.readdirSync('src/messages').filter(f => f.endsWith('.json') && f !== 'pt-BR.json' && f !== 'en-US.json');

for (const file of files) {
  try {
    const existingObj = JSON.parse(fs.readFileSync(`src/messages/${file}`, 'utf8'));
    // Merge pt as fallback to existing languages
    function deepMerge(target, source) {
      for (const key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          if (!target[key] || target[key] === '') {
            target[key] = source[key];
          }
        }
      }
    }
    deepMerge(existingObj, pt);
    fs.writeFileSync(`src/messages/${file}`, JSON.stringify(existingObj, null, 2));
  } catch (e) {
    // If it's corrupted, just copy pt-BR
    fs.writeFileSync(`src/messages/${file}`, JSON.stringify(pt, null, 2));
  }
}
