const fs = require('fs');

// 1. App.tsx layout
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Change the parent container to be scrollable
appCode = appCode.replace(
    '<div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">',
    '<div id="main-scroll-container" className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">'
);

// Make the Header wrapper sticky
appCode = appCode.replace(
    '<Header',
    '<div className="sticky top-0 z-40 shrink-0">\n        <Header'
);
appCode = appCode.replace(
    'onToggleMobileMenu={() => setIsOpenMobile((prev) => !prev)}\n        />',
    'onToggleMobileMenu={() => setIsOpenMobile((prev) => !prev)}\n        />\n        </div>'
);

// Remove overflow-y-auto from main
appCode = appCode.replace(
    '<main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-8 lg:p-8 max-w-7xl mx-auto w-full">',
    '<main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-8 lg:p-8 max-w-7xl mx-auto w-full">'
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('App.tsx layout fixed');

// 2. Header.tsx adjustments
let headerCode = fs.readFileSync('src/components/Header.tsx', 'utf8');

// We need to change the Desktop Header width to perfectly match the main content padding.
// main has max-w-7xl and lg:p-8 (which means 2rem padding). 
// So the content inside main is max-w-[calc(80rem-4rem)] = 76rem.
// To perfectly align the glassmorphism pill, we keep it as max-w-[76rem] and w-[calc(100%-4rem)] or w-[calc(100%-2rem)].
// Wait! If main has w-full max-w-7xl and lg:p-8, then on a 1000px screen, main is 1000px, padding is 32px. Content is 936px.
// If Header has w-[calc(100%-4rem)] max-w-[76rem], on 1000px screen, it is 1000px - 64px = 936px.
// So w-[calc(100%-4rem)] is mathematically perfect for lg:p-8! (4rem = 64px, which is 32px left + 32px right).
// And for sm:p-6 (1.5rem), it's 3rem total. 

// Let's modify Header to use exactly the same padding structure as main.
// If Header container is w-full max-w-7xl mx-auto lg:px-8, and the pill is inside it with w-full!
const oldDesktopHeader = 'className="hidden lg:flex h-20 bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg rounded-3xl border border-white/60 dark:border-white/20 px-8 items-center justify-between shrink-0 z-30 transition-colors shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] w-[calc(100%-4rem)] max-w-[76rem] mx-auto mt-4"';

const newDesktopHeader = 'className="hidden lg:flex h-20 bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg rounded-3xl border border-white/60 dark:border-white/20 px-8 items-center justify-between shrink-0 z-30 transition-colors shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] w-full mx-auto"';

// Wait, if we use w-full mx-auto on the header pill, and wrap it in a container that matches `main`:
headerCode = headerCode.replace(
    oldDesktopHeader,
    'className="hidden lg:flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">\n        <div className="flex h-20 bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg rounded-3xl border border-white/60 dark:border-white/20 px-8 items-center justify-between shrink-0 z-30 transition-colors shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] w-full"'
);
headerCode = headerCode.replace(
    '{/* School Branding & Mobile Menu Hamburger Button */}',
    '{/* School Branding & Mobile Menu Hamburger Button */}'
);

// We added a <div>, so we need to close it at the end of the desktop header.
const desktopHeaderEnd = headerCode.indexOf('</header>', headerCode.indexOf('className="hidden lg:flex w-full max-w-7xl'));
if (desktopHeaderEnd !== -1) {
    headerCode = headerCode.substring(0, desktopHeaderEnd) + '</div>\n      </header>' + headerCode.substring(desktopHeaderEnd + '</header>'.length);
}

fs.writeFileSync('src/components/Header.tsx', headerCode);
console.log('Header.tsx layout fixed');

