const fs = require('fs');

let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Find the desktop header
// It currently looks like: <header className="hidden lg:flex h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 px-8 items-center justify-between shrink-0 z-30 transition-colors shadow-xs">

const oldDesktopHeader = '<header className="hidden lg:flex h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 px-8 items-center justify-between shrink-0 z-30 transition-colors shadow-xs">';
const newDesktopHeader = '<header className="hidden lg:flex h-20 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-3xl border border-white/40 dark:border-slate-700/40 px-8 items-center justify-between shrink-0 z-30 transition-colors shadow-xl shadow-slate-200/10 dark:shadow-none w-[calc(100%-4rem)] max-w-[76rem] mx-auto mt-4">';

if (code.includes(oldDesktopHeader)) {
    code = code.replace(oldDesktopHeader, newDesktopHeader);
    fs.writeFileSync('src/components/Header.tsx', code);
    console.log('Header successfully updated!');
} else {
    console.log('Could not find the desktop header string.');
}
