const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const oldDiv = '<div className="h-full flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/60 dark:border-slate-700/50 dark:border-slate-800 transition-colors w-64 select-none">';

// For mobile: keep it h-full, bg-white/60, backdrop-blur-xl, border-r
// For desktop (lg): h-[calc(100vh-2rem)], bg-white/20, backdrop-blur-md (12px), rounded-3xl, border on all sides, margin 4
const newDiv = '<div className="flex flex-col transition-colors w-64 select-none h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/60 dark:border-slate-700/50 dark:border-slate-800 lg:h-[calc(100vh-2rem)] lg:bg-white/20 lg:dark:bg-slate-900/20 lg:backdrop-blur-md lg:rounded-3xl lg:border-r lg:border lg:border-white/40 lg:dark:border-slate-700/40 lg:m-4 lg:shadow-xl lg:shadow-slate-200/10 lg:dark:shadow-none overflow-hidden">';

code = code.replace(oldDiv, newDiv);

// Also need to make sure the footer inside Sidebar has appropriate background for transparency
// It was: <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
const oldFooter = '<div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">';
const newFooter = '<div className="p-4 border-t border-white/20 dark:border-slate-700/40 bg-slate-50/30 lg:bg-transparent dark:bg-slate-800/20">';
code = code.replace(oldFooter, newFooter);

// Also Header of Sidebar
const oldHeader = '<div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">';
const newHeader = '<div className="p-5 border-b border-white/20 dark:border-slate-700/40 flex items-center justify-between">';
code = code.replace(oldHeader, newHeader);


fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Sidebar updated');
