const fs = require('fs');
const https = require('https');
const zlib = require('zlib');
const path = require('path');

function encode(text) {
  const data = Buffer.from(text, 'utf8');
  const compressed = zlib.deflateSync(data);
  return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const mdPath = path.join(__dirname, 'Flowcharts.md');
const md = fs.readFileSync(mdPath, 'utf8');
const regex = /```mermaid\n([\s\S]*?)```/g;
let match;
let count = 1;

const names = [
  "Admin_Setup_Flow",
  "Student_Lifecycle_Journey",
  "Department_Staff_Protocol",
  "Departmental_Clearance_Hierarchy"
];

while ((match = regex.exec(md)) !== null) {
  const code = match[1];
  const payload = encode(code);
  const url = `https://kroki.io/mermaid/png/${payload}`;
  
  const filename = `${names[count-1] || `Flowchart_${count}`}.png`;
  const dest = path.join(__dirname, filename);
  
  console.log(`Downloading ${filename}...`);
  
  (function(fileUrl, destination) {
    https.get(fileUrl, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(destination);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Saved: ${destination}`);
        });
      } else {
        console.error(`❌ Failed to download ${destination}. Status code: ${res.statusCode}`);
      }
    }).on('error', (err) => {
      console.error(`Error downloading ${destination}: ${err.message}`);
    });
  })(url, dest);
  
  count++;
}
