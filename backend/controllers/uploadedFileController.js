const UploadedFile = require('../models/UploadedFile');
exports.saveFileInfo = async (req, res) => {
  try {
    const { filename, filepath } = req.body;
    const file = new UploadedFile({ filename, filepath });
    await file.save();
    res.status(201).json(file);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
