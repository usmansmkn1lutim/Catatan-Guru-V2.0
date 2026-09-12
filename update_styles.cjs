const fs = require('fs');

// 1. Update Header.tsx
let headerCode = fs.readFileSync('src/components/Header.tsx', 'utf8');
const oldHeaderStyle = 'bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-3xl border border-white/40 dark:border-slate-700/40 px-8 items-center justify-between shrink-0 z-30 transition-colors shadow-xl shadow-slate-200/10 dark:shadow-none';
const newHeaderStyle = 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg rounded-3xl border border-white/30 dark:border-slate-700/40 px-8 items-center justify-between shrink-0 z-30 transition-colors shadow-[0_12px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]';

if (headerCode.includes(oldHeaderStyle)) {
    headerCode = headerCode.replace(oldHeaderStyle, newHeaderStyle);
    fs.writeFileSync('src/components/Header.tsx', headerCode);
    console.log('Updated Header.tsx');
} else {
    console.log('Could not find old style in Header.tsx');
}

// 2. Update Dashboard.tsx
let dashCode = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// There are multiple variations of the old glassmorphism class in Dashboard.tsx
// Variation 1 (Cards):
// bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-white/60 dark:border-slate-700/50 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none

// Let's use regex to match all instances of the background and replace the whole thing.
// A simpler way is to replace specific classes individually since they are space-separated, but we want to remove the extra border classes and shadow classes and replace them.

dashCode = dashCode.replace(/bg-white\/60 dark:bg-slate-900\/60 backdrop-blur-xl/g, 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg');
dashCode = dashCode.replace(/border-white\/60 dark:border-slate-700\/50 dark:border-slate-800/g, 'border-white/30 dark:border-slate-700/40');
dashCode = dashCode.replace(/shadow-lg shadow-slate-200\/40 dark:shadow-none/g, 'shadow-[0_12px_40px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]');

fs.writeFileSync('src/components/Dashboard.tsx', dashCode);
console.log('Updated Dashboard.tsx');
