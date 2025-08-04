const express = require('express');
const router = express.Router();

const {
  uploadPdfInMemory,
  uploadImageToDisk
} = require('../middleware/upload');

const {
  convertPDF,
  convertImagesToPDF,
  convertPdfToEpub
} = require('../controllers/convertController');

// Routes
router.post('/pdf-to-images', uploadPdfInMemory.single('pdf'), convertPDF);
router.post('/images-to-pdf', uploadImageToDisk.array('images', 10), convertImagesToPDF);
router.post('/pdf-to-epub', uploadPdfInMemory.single('pdf'), convertPdfToEpub);

module.exports = router;
