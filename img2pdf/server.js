const express = require('express');
const { createAllFolders } = require('../Api/utils/folderUtils');
const imageToPdfRoute = require('../Api/Routes/convertRoute');

const app = express();
const PORT = 5000;

// Ensure image upload folder exists
createAllFolders();

// Use the combined routes
app.use('/convert', imageToPdfRoute);

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
