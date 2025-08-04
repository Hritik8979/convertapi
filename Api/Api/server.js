const express = require('express');
const path = require('path');
const cors = require('cors');

const { createFolders } = require('./utils/folderUtils');
const convertRoutes = require('./Routes/convertRoute');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure necessary folders exist
createFolders();

// API Routes
app.use('/convert', convertRoutes);

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'images')));               // PDF → Image
app.use('/uploads', express.static(path.join(__dirname, 'uploaded_images')));     // Image → PDF
app.use('/epubs', express.static(path.join(__dirname, 'epubs')));                 // EPUB output
app.use('/temp_epub_images', express.static(path.join(__dirname, 'temp_epub_images'))); // EPUB image content

// Start server
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
