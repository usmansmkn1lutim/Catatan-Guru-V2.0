const fs = require('fs');

function applyGlassmorphism(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Replace solid backgrounds with glassmorphism backgrounds
    code = code.replace(/bg-white dark:bg-slate-900/g, 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl');
    code = code.replace(/border-slate-200/g, 'border-white/60 dark:border-slate-700/50');
    code = code.replace(/shadow-sm/g, 'shadow-lg shadow-slate-200/40 dark:shadow-none');
    // Ensure we don't double up shadow classes if they were already there, but it should be fine.

    fs.writeFileSync(filePath, code);
    console.log(`Applied glassmorphism to ${filePath}`);
}

applyGlassmorphism('src/components/Dashboard.tsx');
applyGlassmorphism('src/components/Sidebar.tsx');
// Not applying to Header blindly, let's check Header later.
