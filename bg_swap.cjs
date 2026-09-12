const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldDiv = '<div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased overflow-hidden">';
const newDiv = `<div className="h-screen w-screen bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 flex font-sans antialiased overflow-hidden relative">
      {/* Glassmorphism Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-cyan-400/30 dark:bg-cyan-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
      </div>
      <div className="z-10 flex w-full h-full">`;

// Note: I also need to close the extra div at the end if I add one, but wait, the original was `flex`, so if I wrap the children in a flex container `z-10 flex w-full h-full`, I need to close it.
// Actually, it's easier to just add the background as a sibling to the rest of the children, and since the rest of the children might be position relative/absolute, they will stack correctly if we just put the background first. 
// Let's just make the background `z-0` and let the rest naturally sit on top if we make them relative/z-10, or just let the background be absolute inset-0 pointer-events-none.

const betterNewDiv = `<div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased overflow-hidden relative z-0">
      {/* Glassmorphism Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/20 dark:bg-cyan-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-violet-400/20 dark:bg-violet-600/20 rounded-full blur-[120px]" />
      </div>`;

code = code.replace(oldDiv, betterNewDiv);
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx background updated');
