const fs = require('fs');
const path = require('path');

// Folders for PDF → Image
const uploadDir = path.join(__dirname, '..', 'uploads');
const outputDir = path.join(__dirname, '..', 'images');

// Folders for Image → PDF
const uploadedImagesDir = path.join(__dirname, '..', 'uploaded_images');
const pdfOutputDir = path.join(__dirname, '..', '..', 'img2pdf', 'pdf_output'); // Folder, not file

function createAllFolders() {
  // PDF to Image folders
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Image to PDF folders
  if (!fs.existsSync(uploadedImagesDir)) {
    fs.mkdirSync(uploadedImagesDir, { recursive: true });
  }

  if (!fs.existsSync(pdfOutputDir)) {
    fs.mkdirSync(pdfOutputDir, { recursive: true });
  }
}

module.exports = {
  createAllFolders,
  paths: {
    uploadDir,
    outputDir,
    uploadedImagesDir,
    pdfOutputDir
  }
};
