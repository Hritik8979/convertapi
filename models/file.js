const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: String,
  outputFiles: [{
    format: String,
    path: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('File', fileSchema);
