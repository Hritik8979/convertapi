const express = require('express');
const router = express.Router();


const {
  uploadPdfInMemory,
  uploadImageToDisk,
  uploadPdfToDisk,
  uploadPdfAndImage,
  uploadAllFiles
} = require('../middleware/upload');

const {
  convertPDF,
  convertImagesToPDF,
  convertPdfToEpub,
  editPdfText,
  insertTextToPdf,
  addImageToPdf,
  cropImageBeforeInsert,
  drawShapesOnPdf,
  highlightTextInPdf,
  batchConvert
} = require('../controllers/convertController');

// Route: PDF → Image
router.post('/pdf-to-image', uploadPdfInMemory.single('pdf'), convertPDF);

// Route: Images → PDF
router.post('/images-to-pdf', uploadImageToDisk.array('images', 10), convertImagesToPDF);

// Route: PDF → EPUB
router.post('/pdf-to-epub', uploadPdfInMemory.single('pdf'), convertPdfToEpub);

// Route: Edit Text
router.post('/edit-text', uploadPdfToDisk.single('pdf'), editPdfText);

// Route: Insert Text
router.post('/insert-text', uploadPdfToDisk.single('pdf'), insertTextToPdf);

// Route: Add Image to PDF
router.post('/add-image', uploadPdfAndImage, addImageToPdf);

// Route: Crop Image before Insert
router.post('/crop-image', uploadPdfAndImage, cropImageBeforeInsert);

// Route: Draw Shapes
router.post('/draw-shape', uploadPdfToDisk.single('pdf'), drawShapesOnPdf);

// Route: Highlight Text
router.post('/highlight-text', uploadPdfToDisk.single('pdf'), highlightTextInPdf);

// Route: Batch Conversion

router.post('/batch-convert', uploadAllFiles.array('files', 10), batchConvert);

module.exports = router;
