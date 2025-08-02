const multer = require('multer');
const path = require('path');
const uploadDir = path.join(__dirname, '..', 'uploaded_images');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const uploadImage = multer({ storage });
module.exports = uploadImage;
