const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, '..', 'uploads'),            // for uploaded PDFs (pdf-to-img / pdf-to-epub)
  path.join(__dirname, '..', 'images'),             // for PNGs generated from PDFs
  path.join(__dirname, '..', 'uploaded_images'),    // for images uploaded for image-to-pdf
  path.join(__dirname, '..', 'outputs'),            // common output folder
  path.join(__dirname, '..', 'epubs'), 
  path.join(__dirname, '..', 'temp_epub_images'),             // for EPUB output files
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
