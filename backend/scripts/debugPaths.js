const path = require('path');
const fs = require('fs');

console.log('\n🔍 Path Debug Information\n');
console.log('='.repeat(60));

// 1. Process information
console.log('\n📍 Process Information:');
console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);

// 2. Check for package.json
console.log('\n📦 Package.json Location:');
const possibleRoots = [
  process.cwd(),
  __dirname,
  path.resolve(__dirname, '..'),
  path.resolve(__dirname, '../..')
];

let foundRoot = null;
possibleRoots.forEach((dir, index) => {
  const pkgPath = path.join(dir, 'package.json');
  const exists = fs.existsSync(pkgPath);
  console.log(`${index + 1}. ${dir}`);
  console.log(`   package.json: ${exists ? '✅ FOUND' : '❌ Not found'}`);
  if (exists && !foundRoot) {
    foundRoot = dir;
  }
});

if (foundRoot) {
  console.log('\n✅ Project root detected:', foundRoot);
} else {
  console.log('\n❌ Could not find project root!');
}

// 3. Check uploads directory
console.log('\n📁 Uploads Directory Status:');
const uploadsPaths = [
  path.join(process.cwd(), 'uploads'),
  path.join(__dirname, 'uploads'),
  path.join(__dirname, '..', 'uploads'),
  foundRoot ? path.join(foundRoot, 'uploads') : null
].filter(Boolean);

uploadsPaths.forEach((uploadsPath, index) => {
  const exists = fs.existsSync(uploadsPath);
  console.log(`${index + 1}. ${uploadsPath}`);
  console.log(`   Exists: ${exists ? '✅' : '❌'}`);

  if (exists) {
    const thumbPath = path.join(uploadsPath, 'thumbnails');
    const thumbExists = fs.existsSync(thumbPath);
    console.log(`   thumbnails/: ${thumbExists ? '✅' : '❌'}`);
  }
});

// 4. Recommended paths
console.log('\n💡 Recommended Configuration:');
const recommendedRoot = foundRoot || process.cwd();
const recommendedUploads = path.join(recommendedRoot, 'uploads');
const recommendedThumbnails = path.join(recommendedUploads, 'thumbnails');

console.log('Project Root:', recommendedRoot);
console.log('Uploads Dir:', recommendedUploads);
console.log('Thumbnails Dir:', recommendedThumbnails);

// 5. Create directories
console.log('\n🔧 Creating Directories:');
try {
  if (!fs.existsSync(recommendedUploads)) {
    fs.mkdirSync(recommendedUploads, { recursive: true });
    console.log('✅ Created:', recommendedUploads);
  } else {
    console.log('✓ Already exists:', recommendedUploads);
  }

  if (!fs.existsSync(recommendedThumbnails)) {
    fs.mkdirSync(recommendedThumbnails, { recursive: true });
    console.log('✅ Created:', recommendedThumbnails);
  } else {
    console.log('✓ Already exists:', recommendedThumbnails);
  }

  // Test write permission
  const testFile = path.join(recommendedUploads, '.write-test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✅ Write permissions: OK');
} catch (error) {
  console.log('❌ Error:', error.message);
}

// 6. Environment check
console.log('\n🔐 Environment:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('Platform:', process.platform);
console.log('Node version:', process.version);

console.log('\n' + '='.repeat(60));
console.log('✨ Debug complete!\n');

// 7. Generate config snippet
console.log('📋 Use this in your routes file:\n');
console.log(`const path = require('path');`);
console.log(`const projectRoot = '${recommendedRoot}';`);
console.log(`const uploadsDir = path.join(projectRoot, 'uploads');`);
console.log(`const thumbnailsDir = path.join(uploadsDir, 'thumbnails');\n`);
