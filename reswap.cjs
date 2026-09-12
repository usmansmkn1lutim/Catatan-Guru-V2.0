const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Find Chart Section
const chartStart = code.indexOf('{/* Chart Section */}');
const chartEnd = code.indexOf('</section>', chartStart) + '</section>'.length;
let chartCode = code.substring(chartStart, chartEnd);

// Find 4 Stat Cards
const statCardsStart = code.indexOf('{/* 4 Stat Cards */}');
const statCardsEnd = code.indexOf('</div>', code.indexOf('Aktif', statCardsStart)) + 1;
// Wait, `statCardsEnd` is harder to find this way. Let's look for `{/* Action Panel */}`
const actionPanelStart = code.indexOf('{/* Action Panel */}');

let statCardsCode = code.substring(statCardsStart, actionPanelStart);

// Clean up
chartCode = chartCode.replace('<section className="bg-white/60 dark:bg-slate-900/60', '<div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60');
chartCode = chartCode.replace(/<\/section>$/, '</div>');

statCardsCode = statCardsCode.replace('<div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-6">', '<section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">');
// Find the last </div> in statCardsCode and replace with </section>
const lastDivIndex = statCardsCode.lastIndexOf('</div>');
if (lastDivIndex !== -1) {
    statCardsCode = statCardsCode.substring(0, lastDivIndex) + '</section>\n\n        ' + statCardsCode.substring(lastDivIndex + 6);
}

// Ensure the wrapper is right
code = code.substring(0, chartStart) + statCardsCode + code.substring(chartEnd, statCardsStart) + chartCode + '\n\n        ' + code.substring(actionPanelStart);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('Reswapped successfully');
