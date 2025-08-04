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

// Memory storage (for in-memory PDF processing)
const memoryStorage = multer.memoryStorage();
const uploadPdfInMemory = multer({ storage: memoryStorage });

// Disk storage for image uploads
const imageDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadImagesDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const uploadImageToDisk = multer({ storage: imageDiskStorage });

// Disk storage for general PDF uploads
const pdfDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPdfDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const uploadPdfToDisk = multer({ storage: pdfDiskStorage });

// Multi-field upload (PDF + image for image-insertion)
const uploadPdfAndImage = multer({ storage: pdfDiskStorage }).fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);
const storageAllFiles = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // or your preferred dir
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});

const uploadAllFiles = multer({ storage: storageAllFiles });


module.exports = {
  uploadPdfInMemory,    // for PDF-to-Image / EPUB
  uploadImageToDisk,    // for Image-to-PDF
  uploadPdfToDisk,      // for general editing
  uploadPdfAndImage,
  uploadAllFiles    //for Add Image to PDF
};
