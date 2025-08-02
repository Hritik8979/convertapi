const multer = require('multer');
const storage = multer.memoryStorage(); // buffer in memory
const upload = multer({ storage });
module.exports = upload;
