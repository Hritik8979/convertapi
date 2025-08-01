const fs = require('fs')
const path = require('path')
const pdf = require('pdf-poppler')
const PDFDocument = require('pdfkit');

const uploadDir = path.join(__dirname, '..', 'uploads')
const outputDir = path.join(__dirname, '..', 'images')

exports.convertPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No PDF file uploaded.')

    // Save PDF from memory to disk
    const pdfPath = path.join(uploadDir, 'uploaded.pdf')
    fs.writeFileSync(pdfPath, req.file.buffer)

    const options = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: 'page',
      page: null,
    }

    console.log('Converting PDF to images...')
    await pdf.convert(pdfPath, options)
    console.log('Conversion completed')

    res.status(200).send('PDF converted to images. Check the /images folder.')
  } catch (err) {
    console.error('Conversion error:', err.message)
    res.status(500).send('PDF to images conversion failed.')
  }
}
////////////////////////////////////

exports.convertImagesToPDF = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No images uploaded.');
  }

  const pdfPath = path.join(__dirname, '..', '..', 'img2pdf', 'pdf_output', 'output.pdf');
  const doc = new PDFDocument({ autoFirstPage: false });
  console.log('Saving final PDF to:', pdfPath);
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  try {
    req.files.forEach(file => {
      const imagePath = file.path;
      const image = doc.openImage(imagePath);
      doc.addPage({ size: [image.width, image.height] });
      doc.image(imagePath, 0, 0);
    });

    doc.end();

    stream.on('finish', () => {
      console.log('PDF created at:', pdfPath);
      res.send('Images converted to PDF. File saved as output.pdf.');
    });
  } catch (err) {
    console.error('Conversion error:', err.message);
    res.status(500).send('Failed to convert images to PDF.');
  }
};
