const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const oldDiv = 'className="flex flex-col transition-colors w-64 select-none h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/60 dark:border-slate-700/50 dark:border-slate-800 lg:h-[calc(100vh-2rem)] lg:bg-white/20 lg:dark:bg-slate-900/20 lg:backdrop-blur-md lg:rounded-3xl lg:border-r lg:border lg:border-white/40 lg:dark:border-slate-700/40 lg:m-4 lg:shadow-xl lg:shadow-slate-200/10 lg:dark:shadow-none overflow-hidden"';

const newDiv = 'className="flex flex-col transition-colors w-64 select-none h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/60 dark:border-slate-700/50 dark:border-slate-800 lg:h-[calc(100vh-2rem)] lg:bg-white/10 lg:dark:bg-slate-900/10 lg:backdrop-blur-lg lg:rounded-3xl lg:border lg:border-white/30 lg:dark:border-slate-700/40 lg:m-4 lg:shadow-[0_12px_40px_rgba(0,0,0,0.25)] lg:dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden"';

code = code.replace(oldDiv, newDiv);
fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Sidebar tweaked');
