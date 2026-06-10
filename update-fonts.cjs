const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx,css}');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  if (file.endsWith('index.css')) {
    content = content.replace(/font-family:\s*"Georgia",\s*serif;/g, 'font-family: var(--font-sans);');
    content = content.replace(/font-family:\s*"Georgia",\s*serif\s*!important;\n?/g, '');
  } else if (file.endsWith('theme.css')) {
    content = content.replace(/:root,\n\[data-theme="light"\] \{/g, ':root,\n[data-theme="light"] {\n  /* Fonts */\n  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\n  --font-serif: "Georgia", serif;\n');
  } else if (file.endsWith('RichEditor.tsx') || file.endsWith('MentionExtension.ts')) {
    content = content.replace(/font-family:\s*Georgia,\s*serif;/g, 'font-family: var(--font-serif);');
    content = content.replace(/fontFamily:\s*['"]?['"]?Georgia['"]?,\s*serif['"]?['"]?/g, 'fontFamily: "var(--font-serif)"');
  } else {
    // Catch `fontFamily: "Georgia, serif",` or `fontFamily: "'Georgia', serif",` or `fontFamily: "'Georgia',serif",`
    content = content.replace(/\s*fontFamily:\s*['"]?['"]?Georgia['"]?,\s*serif['"]?['"]?,?/g, '');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
}
console.log('Fonts updated!');
