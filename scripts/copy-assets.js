const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  try {
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`Successfully copied ${src} to ${dest}`);
  } catch (err) {
    console.error(`Error copying ${src} to ${dest}:`, err);
    process.exit(1);
  }
}

// Copy static assets
copyDir(
  path.join(__dirname, '../.next/static'),
  path.join(__dirname, '../.next/standalone/.next/static')
);

// Copy public directory
copyDir(
  path.join(__dirname, '../public'),
  path.join(__dirname, '../.next/standalone/public')
);
