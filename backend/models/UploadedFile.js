const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema, 'uploaded_files');

module.exports = UploadedFile;const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema, 'uploaded_files');

module.exports = UploadedFile;
