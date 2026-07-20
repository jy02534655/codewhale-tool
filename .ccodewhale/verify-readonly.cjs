const fs = require('fs');
const path = 'packages/web/src/views/settings/cards/readonlyGroups.js';
const content = fs.readFileSync(path, 'utf8');

// Extract all label keys and titleKeys
const labelMatches = content.match(/label:\s*'([^']+)'/g) || [];
const titleMatches = content.match(/titleKey:\s*'([^']+)'/g) || [];

const keys = new Set();
labelMatches.forEach(m => {
  const key = m.match(/label:\s*'([^']+)'/)[1];
  keys.add(key);
  // derive helpKey
  const helpKey = key.replace('settings.readonly.', 'settings.help.');
  keys.add(helpKey);
});
titleMatches.forEach(m => {
  const key = m.match(/titleKey:\s*'([^']+)'/)[1];
  keys.add(key);
});

const files = ['zh-Hans.json', 'en.json', 'ja.json', 'pt-BR.json'];
files.forEach(f => {
  const localePath = 'packages/web/src/locales/' + f;
  const data = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const missing = [];
  keys.forEach(k => {
    const parts = k.split('.');
    let obj = data;
    for (let i = 0; i < parts.length; i++) {
      if (obj[parts[i]] === undefined) {
        missing.push(k);
        break;
      }
      obj = obj[parts[i]];
    }
  });
  if (missing.length > 0) {
    console.error(f + ' missing:', missing.join(', '));
  } else {
    console.log(f + ' OK');
  }
});
