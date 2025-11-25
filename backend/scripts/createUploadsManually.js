const fs = require('fs');
const path = require('path');

console.log('\n📁 Manual Directory Creation\n');

// Find project root
let currentDir = __dirname;
while (
  !fs.existsSync(path.join(currentDir, 'package.json')) &&
  currentDir !== path.parse(currentDir).root
) {
  currentDir = path.dirname(currentDir);
}

const projectRoot = currentDir;
console.log('Project root:', projectRoot);

// Create directories
const dirs = [path.join(projectRoot, 'uploads'), path.join(projectRoot, 'uploads', 'thumbnails')];

console.log('\nCreating directories:');
dirs.forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('✅ Created:', dir);
    } else {
      console.log('✓ Exists:', dir);
    }

    // Verify it's writable
    const testFile = path.join(dir, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('   ✓ Writable');
  } catch (error) {
    console.log('❌ Error with', dir, ':', error.message);
  }
});

console.log('\n✨ Done!\n');
