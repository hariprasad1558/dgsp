const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const FileMeta = require('../models/FileMeta');
const path = require('path');
const Recommendation = require('../models/Recommendation');
const fs = require('fs');

router.get('/download-zip', async (req, res) => {
  try {
    const files = await FileMeta.find();
    if (!files.length) return res.status(404).json({ error: 'No files found' });
    res.setHeader('Content-Disposition', 'attachment; filename=all_uploads.zip');
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => res.status(500).send({ error: err.message }));
    archive.pipe(res);
    files.forEach(file => {
      archive.file(path.resolve(file.path), { name: file.originalname });
    });
    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/download-zip/:recId', async (req, res) => {
  const recno = parseInt(req.params.recId);
  try {
    const rec = await Recommendation.findOne({ recno });
    if (!rec || !rec.data || !rec.data.filesMeta) {
      return res.status(404).json({ error: 'No files for this recommendation' });
    }

    // Extract all filenames from filesMeta
    const files = [];
    Object.values(rec.data.filesMeta).forEach(val => {
      if (Array.isArray(val)) {
        files.push(...val);
      } else if (val) {
        files.push(val);
      }
    });

    const hasHistory = rec.data && rec.data.tableEntries && rec.data.tableEntries.length > 0;

    if (files.length === 0 && !hasHistory) {
      return res.status(404).json({ error: 'No data or files found for this recommendation' });
    }

    res.setHeader('Content-Disposition', `attachment; filename=recommendation_${recno}_export.zip`);
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });
    archive.pipe(res);

    files.forEach(filename => {
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: filename });
      }
    });

    if (hasHistory) {
      archive.append(JSON.stringify(rec.data.tableEntries, null, 2), { name: `Implementation_History_Rec_${recno}.json` });
    }

    archive.finalize();
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/download-zip/batch', async (req, res) => {
  const { entityName, recIds } = req.body;

  if (!recIds || !Array.isArray(recIds) || recIds.length === 0) {
    return res.status(400).json({ error: 'No recommendation IDs provided' });
  }

  try {
    const recs = await Recommendation.find({ recno: { $in: recIds.map(id => parseInt(id)) } });
    if (!recs.length) {
      return res.status(404).json({ error: 'No data found for these recommendations' });
    }

    const safeFilename = (entityName || 'Recommendations').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}_data.zip`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });
    archive.pipe(res);

    let hasFiles = false;

    // Build Summary CSV
    let csvContent = "Rec ID,Recommendation,Actioned By,Status\n";

    for (const rec of recs) {
      const recno = rec.recno;
      if (!rec) continue;

      // Filter entries for this specific entity
      const entityEntries = (rec.data && rec.data.tableEntries) ? rec.data.tableEntries.filter(h => h["Submitted By"] === entityName) : [];
      const hasSignedCopy = entityEntries.some(h => h["Signed Copy"] && h["Signed Copy"] !== '');
      const hasEntityData = entityEntries.length > 0 || hasSignedCopy;

      const status = hasEntityData ? 'Completed' : 'Pending';
      const cleanRec = (rec.recommendation || '').replace(/"/g, '""');
      const cleanActioned = (rec.actionedBy || '').replace(/"/g, '""');
      csvContent += `${recno},"${cleanRec}","${cleanActioned}",${status}\n`;

      if (!hasEntityData) continue;

      const folderName = `Recommendation_${recno}`;
      let filenames = [];

      // Collect all files referenced in this entity's entries
      entityEntries.forEach(row => {
        if (row["Signed Copy"]) filenames.push(row["Signed Copy"]);
        if (row["Implementation Details"]) filenames.push(row["Implementation Details"]);
        if (Array.isArray(row["Related photos/videos"])) {
          filenames.push(...row["Related photos/videos"]);
        } else if (row["Related photos/videos"]) {
          filenames.push(row["Related photos/videos"]);
        }
      });

      // Make filenames unique
      filenames = [...new Set(filenames.filter(Boolean))];

      // Add files to ZIP
      filenames.forEach(filename => {
        const filePath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `${folderName}/${filename}` });
          hasFiles = true;
        }
      });

      // Add filtered history json
      if (entityEntries.length > 0) {
        archive.append(JSON.stringify(entityEntries, null, 2), { name: `${folderName}/Implementation_History_Rec_${recno}.json` });
        hasFiles = true;
      }
    }

    // Add the summary CSV to the root of the ZIP
    archive.append(csvContent, { name: 'summary_report.csv' });

    if (!hasFiles) {
      archive.append(`No specific data entries found for ${entityName}.`, { name: 'info.txt' });
    }

    archive.finalize();
  } catch (err) {
    console.error('Batch download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;