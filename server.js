const express = require('express');
const path = require('path');
const cors = require('cors');

const { createFolders } = require('./utils/folderUtils');
const convertRoutes = require('./Routes/convertRoute');

const app = express();
const PORT = 4000;

// Middleware
corsOptions = {
  origin : 'http://localhost:5173'
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure necessary folders exist at startup
createFolders();

// API Routes
app.use('/convert', convertRoutes);
app.use('/converted', express.static(path.join(__dirname, 'converted')));


// Serve static files for preview or download
app.use('/images', express.static(path.join(__dirname, 'images')));                   // PDF to Image
app.use('/uploads', express.static(path.join(__dirname, 'uploaded_images')));         // Uploaded Images for Image to PDF
app.use('/epubs', express.static(path.join(__dirname, 'epubs')));                     // EPUB output files
app.use('/temp_epub_images', express.static(path.join(__dirname, 'temp_epub_images'))); // Images extracted during EPUB conversion
app.use('/edited', express.static(path.join(__dirname, 'edited')));                   // Edited PDF files

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
