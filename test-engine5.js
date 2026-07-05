const fs = require('fs');
const llm = fs.readFileSync('./src/sources/llm.ts', 'utf8');
console.log(llm);
