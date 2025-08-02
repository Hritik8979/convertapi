const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directories
const uploadImagesDir = path.join(__dirname, '..', 'uploaded_images');
const uploadPdfDir = path.join(__dirname, '..', 'uploads');

// Ensure folders exist
if (!fs.existsSync(uploadImagesDir)) {
  fs.mkdirSync(uploadImagesDir, { recursive: true });
}
if (!fs.existsSync(uploadPdfDir)) {
  fs.mkdirSync(uploadPdfDir, { recursive: true });
}

// 1. Memory storage (for PDFs used in PDF-to-Image & PDF-to-EPUB)
const memoryStorage = multer.memoryStorage();
const uploadPdfInMemory = multer({ storage: memoryStorage });

// 2. Disk storage (for uploaded images in Image-to-PDF)
const imageDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadImagesDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const uploadImageToDisk = multer({ storage: imageDiskStorage });

module.exports = {
  uploadPdfInMemory,    // Use with .single('pdf') for PDF-to-Image and PDF-to-EPUB
  uploadImageToDisk     // Use with .array('images', limit) for Image-to-PDF
};
