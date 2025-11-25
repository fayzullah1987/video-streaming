const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Find project root
let currentDir = __dirname;
while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
  currentDir = path.dirname(currentDir);
}

const uploadsDir = path.join(currentDir, 'uploads');

console.log('\n🧪 Testing Multer Configuration\n');
console.log('Project root:', currentDir);
console.log('Uploads dir:', uploadsDir);
console.log('Directory exists:', fs.existsSync(uploadsDir));

// Create directory
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer destination called');
    console.log('Saving to:', uploadsDir);

    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating directory in multer...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const filename = `test-${Date.now()}.txt`;
    console.log('Multer filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ storage });

console.log('\n✅ Multer configured successfully');
console.log('Storage destination:', uploadsDir);
