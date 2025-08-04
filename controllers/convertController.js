const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pdfPoppler = require('pdf-poppler');
const pdfParse = require('pdf-parse');
const Epub = require('epub-gen');
const Tesseract = require('tesseract.js');
const { PDFDocument: PDFLibDoc, rgb, StandardFonts } = require('pdf-lib');
const sharp = require('sharp');
const mammoth = require('mammoth');
//const libre = require('libreoffice-convert');
const puppeteer = require('puppeteer');
const htmlDocx = require('html-docx-js');



function getExtension(filename) {
  return path.extname(filename).replace('.', '').toLowerCase();
}


// Paths
const uploadDir = path.join(__dirname, '..', 'uploads');
const outputDir = path.join(__dirname, '..', 'images');
const epubsDir = path.join(__dirname, '..', 'epubs');
const outputPdfPath = path.join(__dirname, '..', 'output.pdf');
const editedDir = path.join(__dirname, '..', 'edited');
if (!fs.existsSync(editedDir)) fs.mkdirSync(editedDir);

// Create unique filenames
function generateFilename(base, ext) {
  const timestamp = Date.now();
  return `${base}_${timestamp}.${ext}`;
}

// Format plain text as HTML
function formatTextAsHtml(text) {
  return text
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p}</p>`)
    .join('\n');
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

// PDF → EPUB (with text + OCR from images)
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

    const imageFiles = fs.readdirSync(epubImageDir).filter(f => f.endsWith('.png'));
    const imagePaths = imageFiles.map(f => path.join(epubImageDir, f));

    // Run OCR on each image
    const ocrTexts = await Promise.all(imagePaths.map(imagePath => {
      return Tesseract.recognize(imagePath, 'eng', { logger: () => { } })
        .then(result => result.data.text)
        .catch(err => {
          console.error('OCR error for', imagePath, err.message);
          return '';
        });
    }));

    const combinedOCRText = ocrTexts.join('\n');

    const htmlContent = `
      <h2>Extracted PDF Text</h2>
      ${formatTextAsHtml(pdfData.text)}

      <hr/>
      <h2>Text Extracted from Images (OCR)</h2>
      ${formatTextAsHtml(combinedOCRText)}
    `;

    const outputEpubFile = path.join(epubsDir, generateFilename('output', 'epub'));

    const epubOptions = {
      title: "Converted PDF with OCR",
      author: "Your App",
      content: [
        {
          title: "PDF Content + OCR",
          data: htmlContent
        }
      ],
      output: outputEpubFile
    };

    await new Epub(epubOptions).promise;
    res.json({ message: 'PDF converted to EPUB successfully.', epub: `/epubs/${path.basename(outputEpubFile)}` });
  } catch (err) {
    console.error('PDF to EPUB Error:', err.message);
    res.status(500).send('Failed to convert PDF to EPUB.');
  }
};

///////////////// Add/Edit Text in PDF //////////

exports.editPdfText = async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFLibDoc.load(pdfBytes, { ignoreEncryption: true });

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { text, x = 50, y = 700, fontSize = 14 } = req.body;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    firstPage.drawText(text, {
      x: parseInt(x),
      y: parseInt(y),
      size: parseInt(fontSize),
      font,
      color: rgb(0, 0, 0),
    });

    const editedPdfBytes = await pdfDoc.save();
    const outputPath = path.join(editedDir, `edited_${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, editedPdfBytes);

    res.download(outputPath);
  } catch (err) {
    console.error('Text Edit Error:', err);
    res.status(500).send('Failed to edit PDF text');
  }
};

///////////////////insertTextToPdf/////////////

exports.insertTextToPdf = async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFLibDoc.load(pdfBytes, { ignoreEncryption: true });

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const {
      text,
      x = 50,
      y = 700,
      fontSize = 14,
      color = '0,0,0',
      bold = 'false'
    } = req.body;

    // Choose font
    const font = await pdfDoc.embedFont(
      bold === 'true' ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
    );

    // Parse color
    const [r, g, b] = color.split(',').map(n => parseInt(n.trim()) / 255);

    // Draw text
    firstPage.drawText(text || '', {
      x: parseInt(x),
      y: parseInt(y),
      size: parseInt(fontSize),
      font,
      color: rgb(r, g, b),
    });

    const editedPdfBytes = await pdfDoc.save();
    const outputPath = path.join(editedDir, `styled_${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, editedPdfBytes);

    res.download(outputPath);
  } catch (err) {
    console.error('Insert Styled Text Error:', err);
    res.status(500).send('Failed to insert styled text in PDF.');
  }
};

////////////////addImageToPdf////////////////

exports.addImageToPdf = async (req, res) => {
  try {
    const pdfFile = req.files?.pdf?.[0];
    const imageFile = req.files?.image?.[0];

    if (!pdfFile || !imageFile) {
      return res.status(400).send('Both PDF and image files are required.');
    }

    const {
      x = 0,
      y = 0,
      width = 200,
      height = 200,
      page = 0   // Accept page number (0-indexed)
    } = req.body;

    const pdfBytes = fs.readFileSync(pdfFile.path);
    const imageBytes = fs.readFileSync(imageFile.path);

    const pdfDoc = await PDFLibDoc.load(pdfBytes, { ignoreEncryption: true });

    const pages = pdfDoc.getPages();
    const targetPage = pages[parseInt(page)] || pages[0]; // Select the page

    const embeddedImage = imageFile.mimetype.includes('jpeg')
      ? await pdfDoc.embedJpg(imageBytes)
      : await pdfDoc.embedPng(imageBytes);

    targetPage.drawImage(embeddedImage, {
      x: parseInt(x),
      y: parseInt(y),
      width: parseInt(width),
      height: parseInt(height),
    });

    const outputPath = path.join(editedDir, `custom_image_${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, await pdfDoc.save());

    res.download(outputPath);
  } catch (err) {
    console.error('Add Image Error:', err);
    res.status(500).send('Failed to add image to PDF.');
  }
};


/////////////cropImageBeforeInsert//////////////////

exports.cropImageBeforeInsert = async (req, res) => {
  try {
    const pdfFile = req.files?.pdf?.[0];
    const imageFile = req.files?.image?.[0];

    if (!pdfFile || !imageFile) {
      return res.status(400).send('Both PDF and image files are required.');
    }

    const { left = 0, top = 0, width = 200, height = 200 } = req.body;

    const croppedBuffer = await sharp(imageFile.path)
      .extract({
        left: parseInt(left),
        top: parseInt(top),
        width: parseInt(width),
        height: parseInt(height)
      })
      .toFormat('png') // Convert to PNG
      .toBuffer();

    const pdfBytes = fs.readFileSync(pdfFile.path);
    const pdfDoc = await PDFLibDoc.load(pdfBytes, { ignoreEncryption: true });

    const embeddedImage = await pdfDoc.embedPng(croppedBuffer);

    // Create a new page sized to the image
    const newPage = pdfDoc.addPage([parseInt(width), parseInt(height)]);

    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: parseInt(width),
      height: parseInt(height)
    });

    const outputPath = path.join(editedDir, `cropped_image_on_pdf_${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, await pdfDoc.save());

    res.download(outputPath);
  } catch (err) {
    console.error('Crop and Insert Image Error:', err);
    res.status(500).send('Failed to crop and insert image into PDF.');
  }
};

///////////////drawShapesOnPdf//////////////////

exports.drawShapesOnPdf = async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFLibDoc.load(pdfBytes, { ignoreEncryption: true });

    const {
      shape,
      x = 100,
      y = 500,
      width = 100,
      height = 50,
      radius = 50,
      color = '255,0,0',
      page = 0
    } = req.body;

    const parsedX = parseInt(x);
    const parsedY = parseInt(y);
    const parsedWidth = parseInt(width);
    const parsedHeight = parseInt(height);
    const parsedRadius = parseInt(radius);
    const parsedPage = parseInt(page);

    const [r, g, b] = color.split(',').map(n => parseInt(n.trim()) / 255);

    const pages = pdfDoc.getPages();
    const targetPage = pages[parsedPage] || pages[0];

    if (shape === 'rectangle') {
      targetPage.drawRectangle({
        x: parsedX,
        y: parsedY,
        width: parsedWidth,
        height: parsedHeight,
        color: rgb(r, g, b),
        borderColor: rgb(r, g, b),
        borderWidth: 1
      });
    } else if (shape === 'circle') {
      if (isNaN(parsedRadius)) {
        return res.status(400).send('Missing or invalid radius for circle.');
      }

      targetPage.drawEllipse({
        x: parsedX,
        y: parsedY,
        xScale: parsedRadius,
        yScale: parsedRadius,
        color: rgb(r, g, b)
      });
    } else {
      return res.status(400).send('Invalid shape type. Use "rectangle" or "circle".');
    }

    const editedPdfBytes = await pdfDoc.save();
    const outputPath = path.join(editedDir, `shapes_${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, editedPdfBytes);

    res.download(outputPath);
  } catch (err) {
    console.error('Draw Shape Error:', err);
    res.status(500).send('Failed to draw shape on PDF.');
  }
};

/////////////////highlightTextInPdf//////////////

exports.highlightTextInPdf = async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const { x = 50, y = 700, width = 100, height = 20, page = 0, color = '255,255,0' } = req.body;

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFLibDoc.load(pdfBytes, { ignoreEncryption: true });

    const [r, g, b] = color.split(',').map(n => parseInt(n.trim()) / 255);
    const pages = pdfDoc.getPages();
    const targetPage = pages[parseInt(page)] || pages[0];

    // Draw highlight rectangle
    targetPage.drawRectangle({
      x: parseInt(x),
      y: parseInt(y),
      width: parseInt(width),
      height: parseInt(height),
      color: rgb(r, g, b),
      opacity: 0.5,
    });

    const outputPath = path.join(editedDir, `highlighted_${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, await pdfDoc.save());

    res.download(outputPath);
  } catch (err) {
    console.error('Highlight Text Error:', err.message);
    res.status(500).send('Failed to highlight text in PDF.');
  }
};

function generateOutputPath(inputFilename, outputExt) {
  const nameWithoutExt = path.parse(inputFilename).name;
  const outputName = `${nameWithoutExt}_${Date.now()}.${outputExt}`;
  const outputDir = path.join(__dirname, '..', 'converted');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  return path.join(outputDir, outputName);
}

////////////batchConvert////////////

exports.batchConvert = async (req, res) => {
  try {
    const files = req.files;
    const { targetFormat } = req.body;

    if (!files || files.length === 0 || !targetFormat) {
      return res.status(400).send('Please upload files and specify targetFormat.');
    }

    const targetFormats = targetFormat.toLowerCase().split(',').map(f => f.trim());
    const results = [];

    for (const file of files) {
      const inputPath = file.path;
      const inputExt = getExtension(file.originalname);

      const convertedOutputs = [];

      for (const outputExt of targetFormats) {
        let outputPath = null;

        // PDF → JPG
        if (inputExt === 'pdf' && outputExt === 'jpg') {
          const imgDir = path.join(outputDir, path.parse(file.originalname).name + '_jpg');
          fs.mkdirSync(imgDir, { recursive: true });
          await pdfPoppler.convert(inputPath, {
            format: 'jpeg',
            out_dir: imgDir,
            out_prefix: 'page',
            page: null,
          });
          outputPath = imgDir;
        }

        // PDF → TXT
        else if (inputExt === 'pdf' && outputExt === 'txt') {
          const buffer = fs.readFileSync(inputPath);
          const parsed = await pdfParse(buffer);

          let finalText = parsed.text;

          // If no text found, fallback to OCR
          if (!finalText.trim()) {
            const tempImageDir = path.join(outputDir, path.parse(file.originalname).name);
            fs.mkdirSync(tempImageDir, { recursive: true });

            await pdfPoppler.convert(inputPath, {
              format: 'jpeg',
              out_dir: tempImageDir,
              out_prefix: 'page',
              page: null
            });

            const imageFiles = fs.readdirSync(tempImageDir).filter(f => f.endsWith('.jpg'));
            const imagePaths = imageFiles.map(f => path.join(tempImageDir, f));

            const ocrTexts = await Promise.all(
              imagePaths.map(img =>
                Tesseract.recognize(img, 'eng', { logger: () => { } })
                  .then(result => result.data.text)
                  .catch(err => {
                    console.error('OCR error:', err.message);
                    return '';
                  })
              )
            );

            finalText = ocrTexts.join('\n');
          }

          outputPath = generateOutputPath(file.originalname, 'txt');
          fs.writeFileSync(outputPath, finalText || 'No text could be extracted.');
        }


        // PDF → DOCX (basic HTML→DOCX logic)

        else if (inputExt === 'pdf' && outputExt === 'docx') {
          const buffer = fs.readFileSync(inputPath);
          const parsed = await pdfParse(buffer);

          const html = `<html><body><p>${parsed.text.replace(/\n/g, '</p><p>')}</p></body></html>`;
          const blob = htmlDocx.asBlob(html);

          // Convert Blob to Buffer for Node.js
          const arrayBuffer = await blob.arrayBuffer();
          const docxBuffer = Buffer.from(arrayBuffer);

          outputPath = generateOutputPath(file.originalname, 'docx');
          fs.writeFileSync(outputPath, docxBuffer);
        }

        // DOCX → PDF
        else if (inputExt === 'docx' && outputExt === 'pdf') {
          const { value: html } = await mammoth.convertToHtml({ path: inputPath });
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(`<html><body>${html}</body></html>`);
          outputPath = generateOutputPath(file.originalname, 'pdf');
          await page.pdf({ path: outputPath, format: 'A4' });
          await browser.close();
        }

        // DOCX → TXT
        else if (inputExt === 'docx' && outputExt === 'txt') {
          try {
            const { value: html } = await mammoth.convertToHtml({ path: inputPath });

            // Strip HTML tags to get plain text
            const text = html.replace(/<[^>]*>?/gm, '').trim();

            outputPath = generateOutputPath(file.originalname, 'txt');
            fs.writeFileSync(outputPath, text || 'No text could be extracted.');
          } catch (err) {
            console.error('DOCX to TXT error:', err.message);
            outputPath = null;
          }
        }

        // JPG → PDF
        else if (inputExt === 'jpg' && outputExt === 'pdf') {
          const pdfDoc = await PDFLibDoc.create();
          const imageBytes = fs.readFileSync(inputPath);
          const image = await pdfDoc.embedJpg(imageBytes);
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
          const pdfBytes = await pdfDoc.save();
          outputPath = generateOutputPath(file.originalname, 'pdf');
          fs.writeFileSync(outputPath, pdfBytes);
        }

        if (outputPath) {
          convertedOutputs.push({
            format: outputExt,
            output: outputPath.replace(/\\/g, '/')
          });
        }
      }

      results.push({
        file: file.originalname,
        outputs: convertedOutputs.length > 0 ? convertedOutputs : 'No supported conversion.'
      });
    }

    res.json({ message: 'Batch conversion complete.', results });
  } catch (err) {
    console.error('Batch Conversion Error:', err.message);
    res.status(500).send('Batch conversion failed.');
  }
};



