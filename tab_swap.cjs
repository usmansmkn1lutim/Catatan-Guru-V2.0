const fs = require('fs');
let code = fs.readFileSync('src/components/BottomTabBar.tsx', 'utf8');

const oldDiv1 = '<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 pb-safe">';
const oldDiv2 = '<div className="flex items-center justify-around h-16 px-2">';

const newDiv1 = '<div className="lg:hidden fixed bottom-5 left-5 right-5 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-white/40 dark:border-slate-700/40 shadow-xl shadow-slate-200/10 dark:shadow-none z-40 rounded-3xl">';
const newDiv2 = '<div className="flex items-center justify-around h-16 px-2">';

code = code.replace(oldDiv1, newDiv1);

fs.writeFileSync('src/components/BottomTabBar.tsx', code);
console.log('BottomTabBar updated');
