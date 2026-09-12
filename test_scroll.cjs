const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Revert the layout to separate Header and scrolling main area.
appCode = appCode.replace(
    '<div id="main-scroll-container" className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">',
    '<div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">'
);

// Modify the Header wrapper
appCode = appCode.replace(
    '<div className="sticky top-0 z-40 shrink-0">\n        <Header',
    '<div className="shrink-0 z-40" style={{ scrollbarGutter: \'stable\' }}>\n        <Header'
);

// Wrap main, BottomTabBar, and footer in a scrolling container
appCode = appCode.replace(
    '<main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-8 lg:p-8 max-w-7xl mx-auto w-full">',
    '<div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: \'stable\' }}>\n        <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-8 lg:p-8 max-w-7xl mx-auto w-full">'
);

// Add the closing div for the scroll container after the footer
appCode = appCode.replace(
    '</footer>\n      </div>\n    </div>',
    '</footer>\n        </div>\n      </div>\n    </div>'
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('App.tsx layout reverted to prevent bleed-through');
