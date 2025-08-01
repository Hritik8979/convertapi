const express = require('express');
const router = express.Router();

const uploadPdf = require('../middleware/upload');
const uploadImages = require('../../img2pdf/middleware/uploadImage');

const {
  convertPDF,
  convertImagesToPDF
} = require('../controllers/convertController');

// Route: PDF → Images
router.post('/pdf-to-images', uploadPdf.single('pdf'), convertPDF);

// Route: Images → PDF
router.post('/images-to-pdf', uploadImages.array('images', 10), convertImagesToPDF);

module.exports = router;
