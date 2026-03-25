/**
 * standalone/build.js
 * 
 * Build script for creating standalone Tally executable
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building Tally Remote Fetcher Standalone...\n');

// Create standalone package.json
const standalonePackage = {
  name: 'tally-remote-fetcher',
  version: '2.0.0',
  description: 'Tally ERP Integration - Standalone Application',
  main: 'server.js',
  bin: 'server.js',
  scripts: {
    start: 'node server.js'
  },
  dependencies: {
    "fastify": "^4.26.0",
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/rate-limit": "^9.1.0",
    "axios": "^1.6.7",
    "fast-xml-parser": "^4.3.4",
    "pino": "^8.18.0",
    "pino-pretty": "^11.0.0",
    "zod": "^3.22.4"
  },
  pkg: {
    scripts: ['server.js'],
    assets: [
      'public/**/*',
      'src/**/*',
      'config.js',
      'node_modules/**/*'
    ],
    targets: ['node18-win-x64'],
    outputPath: 'dist',
    compress: 'Brotli'
  }
};

// Write standalone package.json
fs.writeFileSync('package.json', JSON.stringify(standalonePackage, null, 2));
console.log('✅ Created standalone package.json');

// Copy necessary files to standalone folder
const filesToCopy = [
  { src: '../start-server.js', dest: 'server.js' },
  { src: '../config.js', dest: 'config.js' },
  { src: '../public', dest: 'public' }
];

// Copy src folder first, then apply fixes
filesToCopy.forEach(({ src, dest }) => {
  try {
    if (fs.existsSync(src)) {
      // For directories, use recursive copy
      if (fs.statSync(src).isDirectory()) {
        copyRecursive(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
      console.log(`✅ Copied ${src} → ${dest}`);
    } else {
      console.log(`⚠️  Warning: ${src} not found`);
    }
  } catch (error) {
    console.error(`❌ Failed to copy ${src}: ${error.message}`);
  }
});

// Copy src folder separately to apply fixes
if (fs.existsSync('../src')) {
  console.log('✅ Copying src folder...');
  copyRecursive('../src', 'src');
  
  // Apply fixes to copied files
  console.log('🔧 Applying standalone fixes...');
  
  // Fix config/index.js
  const configIndexPath = 'src/config/index.js';
  if (fs.existsSync(configIndexPath)) {
    let configContent = fs.readFileSync(configIndexPath, 'utf8');
    configContent = configContent.replace("require('../../index')", "require('../config')");
    fs.writeFileSync(configIndexPath, configContent);
    console.log('✅ Fixed src/config/index.js');
  }
  
  // Fix app.js
  const appPath = 'src/app.js';
  if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, 'utf8');
    appContent = appContent.replace("require('./config')", "require('../config')");
    fs.writeFileSync(appPath, appContent);
    console.log('✅ Fixed src/app.js');
  }
}

// Recursive directory copy function
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Build executable
try {
  console.log('📦 Building standalone executable...');
  
  const buildCommand = 'pkg package.json --compress Brotli --output dist/tally-remote-fetcher.exe';
  execSync(buildCommand, { stdio: 'inherit' });
  
  console.log('\n✅ Build completed successfully!');
  console.log('📁 Executable: dist/tally-remote-fetcher.exe');
  
  // Check file size
  if (fs.existsSync('dist/tally-remote-fetcher.exe')) {
    const stats = fs.statSync('dist/tally-remote-fetcher.exe');
    const sizeMB = Math.round(stats.size / 1024 / 1024);
    console.log(`📏 Size: ${sizeMB} MB`);
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
