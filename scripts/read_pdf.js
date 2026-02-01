const fs = require('fs');
const pdf = require('pdf-parse');

const filePath = process.argv[2];
const startLine = parseInt(process.argv[3]) || 0;
const endLine = parseInt(process.argv[4]) || 1000;

if (!filePath) {
    console.error('Usage: node read_pdf.js <file_path> [start_line] [end_line]');
    process.exit(1);
}

let dataBuffer = fs.readFileSync(filePath);

pdf(dataBuffer).then(function (data) {
    const lines = data.text.split('\n');
    console.log('--- TEXT START (Lines ' + startLine + ' to ' + Math.min(endLine, lines.length) + ') ---');
    for (let i = startLine; i < Math.min(endLine, lines.length); i++) {
        console.log(i + ': ' + lines[i]);
    }
    console.log('--- TEXT END ---');
}).catch(err => {
    console.error('Error parsing PDF:', err);
});
