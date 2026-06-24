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
  if (filePath.includes('login\\page.js') || filePath.includes('app\\page.js')) return; 

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Change background colors to actual light colors, but keep the dark variants
  content = content.replace(/bg-slate-950/g, 'bg-white');
  content = content.replace(/bg-slate-900 dark:bg-slate-900/g, 'bg-slate-50 dark:bg-slate-900');
  content = content.replace(/bg-slate-900 dark:bg-indigo-650/g, 'bg-slate-50 dark:bg-indigo-650');
  content = content.replace(/bg-slate-900 dark:bg-indigo-600/g, 'bg-slate-50 dark:bg-indigo-600');
  
  // Specific fixes for dashboard/customers/voice
  // 1. "0 HIGH RISK" button in dashboard (RiskBadge)
  content = content.replace(/text-white uppercase/g, 'text-slate-800 dark:text-white uppercase');
  
  // Replace text-white with text-slate-800 dark:text-white where appropriate
  // We can't do this blindly because text-white is used in buttons (bg-[#4285F4] text-white).
  // So we only target text-white that is followed by mt-, tracking-, font- etc. in headers and paragraphs.
  content = content.replace(/text-white( font-| tracking-| mt-| leading-| flex-| w-| h-)/g, 'text-slate-800 dark:text-white$1');
  
  // Fix the customers section stat buttons (bg-red-50 text-red-600 etc.)
  // Actually, let's replace text-white in terms and privacy
  if (filePath.includes('terms') || filePath.includes('privacy') || filePath.includes('success')) {
    content = content.replace(/text-white/g, 'text-slate-800 dark:text-white');
  }

  // Update primary color (Indigo to Google Blue)
  content = content.replace(/indigo-600/g, '[#4285F4]');
  content = content.replace(/indigo-500/g, '[#4285F4]');
  content = content.replace(/indigo-400/g, '[#4285F4]');
  content = content.replace(/indigo-700/g, '[#3367D6]');
  content = content.replace(/indigo-750/g, '[#3367D6]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir('client/app', migrateFile);
walkDir('client/components', migrateFile);
console.log('Migration V2 complete.');
