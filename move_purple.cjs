const fs = require('fs');

// 1. Remove from Header.tsx
let headerCode = fs.readFileSync('src/components/Header.tsx', 'utf8');
const purpleBlockStart = headerCode.indexOf('{/* Mobile Purple Header */}');
const purpleBlockEnd = headerCode.indexOf('</header>', purpleBlockStart) + '</header>'.length;

if (purpleBlockStart !== -1) {
    const purpleBlock = headerCode.substring(purpleBlockStart, purpleBlockEnd);
    headerCode = headerCode.substring(0, purpleBlockStart) + headerCode.substring(purpleBlockEnd);
    fs.writeFileSync('src/components/Header.tsx', headerCode);
    console.log('Removed purple header from Header.tsx');
} else {
    console.log('Could not find purple header in Header.tsx');
}

// 2. Add to Dashboard.tsx
let dashCode = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const injectionTarget = '<div className="space-y-6 pb-12">';
const purpleJSX = `
      {/* Mobile Purple Header */}
      <div className="block lg:hidden bg-violet-600 dark:bg-violet-800 rounded-[2rem] mx-4 mt-4 px-5 pt-6 pb-8 shrink-0 shadow-md text-white relative">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Hello,{" "}
            {profilGuru?.namaGuru
              ? profilGuru.namaGuru.split(",")[0].split(" ")[0]
              : "Guru"}{" "}
            👋
          </h1>
          <p className="text-violet-200 text-sm">
            Semoga harimu menyenangkan
          </p>
        </div>
      </div>
`;

if (dashCode.includes(injectionTarget)) {
    dashCode = dashCode.replace(injectionTarget, injectionTarget + purpleJSX);
    fs.writeFileSync('src/components/Dashboard.tsx', dashCode);
    console.log('Added purple header to Dashboard.tsx');
} else {
    console.log('Could not find injection target in Dashboard.tsx');
}
