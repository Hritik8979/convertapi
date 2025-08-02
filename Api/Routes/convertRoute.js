const express = require('express');
const router = express.Router();

const uploadPdf = require('../middleware/upload');              // PDF → Image
const uploadImages = require('../middleware/uploadImage');      // Images → PDF
const uploadPdfEpub = require('../middleware/Pdf2epub');        // PDF → EPUB

const {
  convertPDF,
  convertImagesToPDF,
  convertPdfToEpub
} = require('../controllers/convertController');

// PDF → Images
router.post('/pdf-to-images', uploadPdf.single('pdf'), convertPDF);

// Images → PDF
router.post('/images-to-pdf', uploadImages.array('images', 10), convertImagesToPDF);

// PDF → EPUB
console.log('convertPdfToEpub:', typeof convertPdfToEpub);

router.post('/pdf-to-epub', uploadPdfEpub.single('pdf'), convertPdfToEpub);

module.exports = router;
