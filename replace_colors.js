const fs = require('fs');
const path = require('path');

const replacements = [
  { match: /amber-500/g, replace: 'primary' },
  { match: /yellow-600/g, replace: 'accent' },
  { match: /amber-400/g, replace: 'primary-light' },
  { match: /yellow-500/g, replace: 'accent-light' },
  { match: /amber-600/g, replace: 'primary-dark' },
  { match: /amber-100/g, replace: 'primary/20' },
  { match: /#f59e0b/gi, replace: '#FB2576' },
  { match: /#d4af37/gi, replace: '#3F0071' },
];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const { match, replace } of replacements) {
        newContent = newContent.replace(match, replace);
      }
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walkDir(path.join(__dirname, 'src'));
