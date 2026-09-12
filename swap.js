const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const statCardsStart = code.indexOf('{/* 4 Stat Cards */}');
const statCardsEnd = code.indexOf('</section>', statCardsStart) + '</section>'.length;
const statCardsCode = code.substring(statCardsStart, statCardsEnd);

const chartStart = code.indexOf('{/* Chart Section */}');
const chartEnd = code.indexOf('{/* Action Panel */}');
const chartCode = code.substring(chartStart, chartEnd);

let newStatCardsCode = statCardsCode.replace('<section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">', '<div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-6">');
newStatCardsCode = newStatCardsCode.replace('</section>', '</div>');
newStatCardsCode = newStatCardsCode.replace('{/* 4 Stat Cards */}', '{/* 4 Stat Cards */}'); // keep as is

let newChartCode = chartCode.replace('<div className="lg:col-span-2 ', '<section className="');
newChartCode = newChartCode.replace(/<\/div>\s*$/, '</section>\n\n        ');

// Replace in original code
// We need to replace statCardsCode with newChartCode
// And replace chartCode with newStatCardsCode

let modified = code.replace(statCardsCode, newChartCode);
modified = modified.replace(chartCode, newStatCardsCode + '\n        ');

fs.writeFileSync('src/components/Dashboard.tsx', modified);
console.log('Swapped successfully');
