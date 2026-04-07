const mongoose = require('mongoose');

const fileMetaSchema = new mongoose.Schema({
  originalname: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: {
    type: String
  },
  size: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FileMeta', fileMetaSchema);

// File upload handler
exports.uploadFile = async (req, res) => {
  const file = req.file;
  const newFile = new fileMetaSchema({
    originalname: file.originalname,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size
  });

  await newFile.save();

  res.send("File uploaded and saved to DB");
};