const fs = require('fs');

const replaceInFile = (path) => {
    let code = fs.readFileSync(path, 'utf8');
    
    // Reduce shadow opacity by 50%
    code = code.replace(/shadow-\[0_12px_40px_rgba\(0,0,0,0\.25\)\]/g, 'shadow-[0_12px_40px_rgba(0,0,0,0.12)]');
    code = code.replace(/dark:shadow-\[0_12px_40px_rgba\(0,0,0,0\.5\)\]/g, 'dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]');
    
    // Enhance white outline (thinner/brighter perception via higher opacity + strict border)
    code = code.replace(/border border-white\/30 dark:border-slate-700\/40/g, 'border border-white/60 dark:border-white/20');
    
    fs.writeFileSync(path, code);
};

['src/components/Header.tsx', 'src/components/Sidebar.tsx', 'src/components/Dashboard.tsx'].forEach(replaceInFile);
console.log('Shadows and outlines tweaked');
