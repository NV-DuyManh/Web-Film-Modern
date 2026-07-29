const fs = require('fs');
let file = fs.readFileSync('src/components/client/header/AvatarFrames.jsx', 'utf8');

// Remove React comments {/* ... */}
file = file.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

// Remove JS single line comments // ...
file = file.replace(/\/\/.*$/gm, '');

// Clean up extra empty lines created by comment removal
file = file.replace(/^\s*[\r\n]/gm, '\n');
// Replace multiple empty lines with a single empty line
file = file.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync('src/components/client/header/AvatarFrames.jsx', file);
console.log('Comments removed.');
