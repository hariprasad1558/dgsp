const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const UploadedFile = require('../models/UploadedFile');
const path = require('path');

// Download all uploaded files as ZIP
router.get('/zip', async (req, res) => {
  try {
    const files = await UploadedFile.find();
    if (!files.length) {
      return res.status(404).json({ error: 'No files found' });
    }
    res.setHeader('Content-Disposition', 'attachment; filename=all_uploads.zip');
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => res.status(500).send({ error: err.message }));
    archive.pipe(res);
    files.forEach(file => {
      archive.file(path.resolve(file.filepath), { name: file.filename });
    });
    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const UploadedFile = require('../models/UploadedFile');
const path = require('path');

// Download all uploaded files as ZIP
router.get('/zip', async (req, res) => {
  try {
    const files = await UploadedFile.find();
    if (!files.length) {
      return res.status(404).json({ error: 'No files found' });
    }
    res.setHeader('Content-Disposition', 'attachment; filename=all_uploads.zip');
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => res.status(500).send({ error: err.message }));
    archive.pipe(res);
    files.forEach(file => {
      archive.file(path.resolve(file.filepath), { name: file.filename });
    });
    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;