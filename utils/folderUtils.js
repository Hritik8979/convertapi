const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, '..', 'uploads'),             // For uploaded PDFs (pdf-to-img / pdf-to-epub)
  path.join(__dirname, '..', 'images'),              // For PNGs generated from PDFs
  path.join(__dirname, '..', 'uploaded_images'),     // For uploaded images (img-to-pdf)
  path.join(__dirname, '..', 'outputs'),             // Common output folder
  path.join(__dirname, '..', 'epubs'),               // For generated EPUB files
  path.join(__dirname, '..', 'temp_epub_images'),    // Temporary folder for EPUB image conversion
  path.join(__dirname, '..', 'edited'),              // For storing edited PDFs
];

function createFolders() {
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created: ${dir}`);
    }
  });
}

module.exports = { createFolders };
