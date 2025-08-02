const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pdfPoppler = require('pdf-poppler');
const pdfParse = require('pdf-parse');
const Epub = require('epub-gen');

// Paths
const uploadDir = path.join(__dirname, '..', 'uploads');
const outputDir = path.join(__dirname, '..', 'images');
const epubsDir = path.join(__dirname, '..', 'epubs');
const outputPdfPath = path.join(__dirname, '..', 'output.pdf');

// Create unique filenames
function generateFilename(base, ext) {
  const timestamp = Date.now();
  return `${base}_${timestamp}.${ext}`;
}

// PDF → Images
exports.convertPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No PDF file uploaded.');

    const pdfPath = path.join(uploadDir, generateFilename('uploaded', 'pdf'));
    fs.writeFileSync(pdfPath, req.file.buffer);

    const options = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: 'page',
      page: null,
    };

    await pdfPoppler.convert(pdfPath, options);
    res.send('PDF converted to images. Check /images folder.');
  } catch (err) {
    console.error('PDF to Image Error:', err.message);
    res.status(500).send('Failed to convert PDF to images.');
  }
};

// Images → PDF
exports.convertImagesToPDF = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No images uploaded.');
  }

  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(outputPdfPath);
  doc.pipe(stream);

  try {
    req.files.forEach(file => {
      const image = doc.openImage(file.path);
      doc.addPage({ size: [image.width, image.height] });
      doc.image(file.path, 0, 0);
    });

    doc.end();

    stream.on('finish', () => {
      console.log('PDF created at:', outputPdfPath);
      res.send('Images converted to PDF. Saved as output.pdf');
    });
  } catch (err) {
    console.error('Image to PDF Error:', err.message);
    res.status(500).send('Failed to convert images to PDF.');
  }
};

// PDF → EPUB (with text + extracted images)
exports.convertPdfToEpub = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No PDF file uploaded.');

    const epubPdfPath = path.join(uploadDir, generateFilename('epub_input', 'pdf'));
    fs.writeFileSync(epubPdfPath, req.file.buffer);

    const pdfBuffer = fs.readFileSync(epubPdfPath);
    const pdfData = await pdfParse(pdfBuffer);

    // Convert to images for embedding in EPUB
    const epubImageDir = path.join(outputDir, path.basename(epubPdfPath, '.pdf'));
    if (!fs.existsSync(epubImageDir)) fs.mkdirSync(epubImageDir, { recursive: true });

    const popplerOptions = {
      format: 'png',
      out_dir: epubImageDir,
      out_prefix: 'page',
      page: null,
    };

    await pdfPoppler.convert(epubPdfPath, popplerOptions);

    // Get list of images with absolute paths for epub-gen
    const imageFiles = fs.readdirSync(epubImageDir).filter(file => file.endsWith('.png'));
    const imagesHtml = imageFiles.map(image => {
      const absolutePath = path.join(epubImageDir, image); // absolute local path
      return `<img src="${absolutePath}" style="width:100%;"/><br/>`;
    }).join('\n');

    const htmlContent = `
      ${formatTextAsHtml(pdfData.text)}
      <hr/>
      <h2>Extracted Images</h2>
      ${imagesHtml}
    `;

    const outputEpubFile = path.join(epubsDir, generateFilename('output', 'epub'));

    const epubOptions = {
      title: "Converted PDF with Images",
      author: "Your App",
      content: [
        {
          title: "PDF Content",
          data: htmlContent
        }
      ],
      output: outputEpubFile
    };

    await new Epub(epubOptions).promise;
    res.send('PDF converted to EPUB. File saved in /epubs folder.');
  } catch (err) {
    console.error('PDF to EPUB Error:', err.message);
    res.status(500).send('Failed to convert PDF to EPUB.');
  }
};

// Helper: Format text into HTML paragraphs
function formatTextAsHtml(text) {
  return text
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p}</p>`)
    .join('\n');
}
