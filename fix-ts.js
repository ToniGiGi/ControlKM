const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./components', processFile);
walk('./app', processFile);

function processFile(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /onValueChange=\{set([A-Za-z0-9_]+)\}/g;
    let match;
    let newContent = content;
    while ((match = regex.exec(content)) !== null) {
      const setter = "set" + match[1];
      newContent = newContent.replace(`onValueChange={${setter}}`, `onValueChange={(v) => ${setter}(v || "")}`);
    }
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
}
