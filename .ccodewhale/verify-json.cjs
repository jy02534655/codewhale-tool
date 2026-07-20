const fs = require('fs');
['zh-Hans.json', 'en.json', 'ja.json', 'pt-BR.json'].forEach(f => {
  const path = 'packages/web/src/locales/' + f;
  try {
    JSON.parse(fs.readFileSync(path, 'utf8'));
    console.log(f + ' OK');
  } catch (e) {
    console.error(f + ' FAIL: ' + e.message);
  }
});
