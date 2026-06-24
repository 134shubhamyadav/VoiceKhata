const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function migrateFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  if (filePath.includes('login\\page.js') || filePath.includes('app\\page.js')) return; // Skip already migrated auth pages

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace hardcoded dark backgrounds
  content = content.replace(/bg-\[\#0B0F19\]/g, 'bg-[#F8FAFC]');
  content = content.replace(/bg-slate-950/g, 'bg-white');
  content = content.replace(/bg-slate-900/g, 'bg-slate-50');
  content = content.replace(/border-slate-900/g, 'border-slate-200');
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  
  // Replace dark text that is usually meant to be slate-800 in light mode
  // But be careful not to replace text-white inside buttons.
  // Actually, let's just strip 'dark:' prefixes so light mode defaults work!
  content = content.replace(/dark:[a-zA-Z0-9\-\[\]\#\/\.]+/g, '');

  // Convert old primary color text/border/bg to new primary
  content = content.replace(/indigo-600/g, '[#4285F4]');
  content = content.replace(/indigo-500/g, '[#4285F4]');
  content = content.replace(/indigo-400/g, '[#4285F4]');
  content = content.replace(/indigo-700/g, '[#3367D6]');
  content = content.replace(/indigo-750/g, '[#3367D6]');
  
  // Clean up double spaces left by removing dark: classes
  content = content.replace(/  +/g, ' ');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('client/app', migrateFile);
walkDir('client/components', migrateFile);
console.log('Migration complete.');
