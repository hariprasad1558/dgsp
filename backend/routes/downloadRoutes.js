const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

// Download all uploaded files as a zip
router.get('/download-all', (req, res) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const zipName = 'all_uploads.zip';

  res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);
  res.setHeader('Content-Type', 'application/zip');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', err => res.status(500).send({ error: err.message }));

  archive.pipe(res);
  archive.directory(uploadsDir, false);
  archive.finalize();
});

module.exports = router;
