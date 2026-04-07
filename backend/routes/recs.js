const express = require('express');
const router = express.Router();
const mongoose = require('../db');
const Recommendation = require('../models/Recommendation');
const Allocation = require('../models/Allocation');
const fs = require('fs-extra');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const FileMeta = require('../models/FileMeta');
const authMiddleware = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// File upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const newFile = new FileMeta({
      originalname: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    await newFile.save();
    res.json({ fileName: req.file.filename, filePath: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
});

// Get single recommendation
router.get('/recommendation/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const dbRec = await Recommendation.findOne({ recno: Number(id) });
    if (!dbRec) return res.status(404).json({ error: 'Not found' });
    res.json({ data: dbRec.data || {} });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all recommendations (filtered by user state if not admin)
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { role, state, department } = req.user;
    const userDept = state || department;

    const filePath = path.join(__dirname, '../../frontend/src/data/recommendations.json');
    const masterRecsRaw = JSON.parse(await fs.readFile(filePath, 'utf8'));
    let masterRecs = masterRecsRaw;

    if (role !== 'admin' && userDept) {
      const allocation = await Allocation.findOne({ department: userDept });
      const assignedIds = allocation ? allocation.rec_ids : [];
      masterRecs = masterRecsRaw.filter(m => assignedIds.includes(m.id));
    }

    const dbRecs = await Recommendation.find();
    
    // Create a map of DB overrides
    const dbMap = {};
    dbRecs.forEach(r => { dbMap[r.recno] = r; });

    // Merge JSON with DB
    const list = masterRecs.map(m => {
      const dbRec = dbMap[m.id];
      const status = dbRec ? dbRec.status : 'Pending';
      return {
        ...m,
        id: m.id,
        status: status,
        details: dbRec ? dbRec.details : '',
        data: dbRec ? dbRec.data : null,
        last_updated_by: dbRec ? dbRec.last_updated_by : ''
      };
    });

    res.json(list);
  } catch (err) {
    console.error('Error fetching unified recommendations:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// stats and list for admin/user
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { role, state, department } = req.user;
    const userDept = state || department;

    // Load master list
    const filePath = path.join(__dirname, '../../frontend/src/data/recommendations.json');
    const masterData = await fs.readFile(filePath, 'utf8');
    let masterRecs = JSON.parse(masterData);

    // If not admin, filter by user's assigned recommendations
    if (role !== 'admin' && userDept) {
      const allocation = await Allocation.findOne({ department: userDept });
      const assignedIds = allocation ? allocation.rec_ids : [];
      masterRecs = masterRecs.filter(m => assignedIds.includes(m.id));
    }

    // Load DB records
    const dbRecs = await Recommendation.find({}, 'recno status details data last_updated_by');
    
    // Create a map for quick lookup
    const dbMap = {};
    dbRecs.forEach(r => {
      dbMap[r.recno] = r;
    });

    const stats = { total: masterRecs.length, completed: 0, pending: 0 };
    
    const list = masterRecs.map(m => {
      const dbRec = dbMap[m.id]; // In JSON, m.id seems to be the recno
      const status = dbRec ? dbRec.status : 'Pending';
      
      if (status === 'Completed') stats.completed++;
      else stats.pending++;

      return {
        ...m, // Include all fields from recommendations.json (recommendation, actionedBy, category, documentFields, etc.)
        id: m.id, // Use recno from JSON
        status: status,
        details: dbRec ? dbRec.details : '',
        data: dbRec ? dbRec.data : null,
        last_updated_by: dbRec ? dbRec.last_updated_by : ''
      };
    });

    res.json({ stats, list });
  } catch (err) {
    console.error('Error in /stats:', err);
    res.status(500).json({ stats: { total: 0, completed: 0, pending: 0 }, list: [] });
  }
});

// state-specific endpoint
router.get('/state', async (req, res) => {
  try {
    const recs = await Recommendation.find({}, 'recno status details');
    const stats = { total: 0, completed: 0, progress: 0, pending: 0 };
    const list = recs.map(r => {
      stats.total++;
      if (r.status === 'Completed') stats.completed++;
      else if (r.status === 'In Progress') stats.progress++;
      else if (r.status === 'Pending') stats.pending++;
      return { id: r._id, status: r.status, details: r.details };
    });
    res.json({ stats, list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ stats: { total: 0, completed: 0, progress: 0, pending: 0 }, list: [] });
  }
});

// update a recommendation (actioned by user)
router.post('/update/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { status, details, data, last_updated_by } = req.body;
  try {
    const update = {
      status: status || 'Pending',
      details: details || '',
      data: data || null,
      last_updated_by: last_updated_by || ''
    };
    await Recommendation.findOneAndUpdate(
      { recno: Number(id) },
      update,
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// user-specific recommendations (filtered to that user)
router.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    // filter recommendations for this user (for now, show all - in production, add userid field)
    const recs = await Recommendation.find({}, 'recno status details').limit(5);
    const stats = { total: recs.length, completed: 0, pending: 0 };
    const list = recs.map(r => {
      if (r.status === 'Completed') stats.completed++;
      else if (r.status === 'Pending') stats.pending++;
      return { id: r._id, status: r.status, details: r.details };
    });
    res.json({ stats, list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ stats: { total: 0, completed: 0, pending: 0 }, list: [] });
  }
});

// Save all recommendations
router.post('/save-all', authMiddleware, adminOnly, async (req, res) => {
  const { recommendations } = req.body;

  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return res.status(400).json({ error: 'No recommendations provided' });
  }

  try {
    for (const rec of recommendations) {
      const { id, status, details, data, last_updated_by } = rec;
      await Recommendation.findByIdAndUpdate(
        id,
        {
          status,
          details,
          data,
          last_updated_by
        },
        { upsert: true }
      );
    }
    res.json({ success: true, message: 'All recommendations saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to save recommendations' });
  }
});

// Endpoint to update base recommendations.json
router.post('/update-json/:id', authMiddleware, adminOnly, async (req, res) => {
  const recId = parseInt(req.params.id);
  const { recommendation, actionedBy, category, stateDepartments } = req.body;
  
  try {
    const filePath = path.join(__dirname, '../../frontend/src/data/recommendations.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    const recommendations = JSON.parse(fileData);
    
    const index = recommendations.findIndex(r => r.id === recId);
    if (index === -1) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    if (recommendation !== undefined) recommendations[index].recommendation = recommendation;
    if (actionedBy !== undefined) recommendations[index].actionedBy = actionedBy;
    if (category !== undefined) recommendations[index].category = category;
    if (stateDepartments !== undefined) recommendations[index].stateDepartments = stateDepartments;
    
    await fs.writeFile(filePath, JSON.stringify(recommendations, null, 2));
    
    res.json({ success: true, message: 'Recommendation base properties updated successfully' });
  } catch (err) {
    console.error('Failed to update recommendations.json:', err);
    res.status(500).json({ error: 'Internal Server Error while saving changes' });
  }
});

// Create new recommendation
router.post('/recommendations', authMiddleware, adminOnly, async (req, res) => {
  const { recommendation, actionedBy, category } = req.body;
  if (!recommendation) return res.status(400).json({ error: 'Recommendation text is required' });
  
  try {
    const filePath = path.join(__dirname, '../../frontend/src/data/recommendations.json');
    const recommendations = await fs.readJson(filePath);
    
    // Find max ID/recNo safely
    let maxId = 0;
    let maxRecNo = 0;
    recommendations.forEach(r => {
      const rid = parseInt(r.id);
      const rno = parseInt(r.recNo);
      if (!isNaN(rid) && rid > maxId) maxId = rid;
      if (!isNaN(rno) && rno > maxRecNo) maxRecNo = rno;
    });
    
    const newRec = {
      id: maxId + 1,
      recNo: (maxRecNo + 1).toString(),
      recommendation,
      actionedBy: actionedBy || '',
      category: category || 'Immediately Actionable',
      documentFields: [
        { field: "Upload Word Document", type: "file", accept: ".doc,.docx" },
        { field: "Upload Photos", type: "file", accept: "image/*", multiple: true },
        { field: "Upload Signed Copy", type: "file", accept: ".pdf,image/*" }
      ]
    };
    
    recommendations.push(newRec);
    await fs.writeJson(filePath, recommendations, { spaces: 2 });
    
    res.json({ success: true, data: newRec });
  } catch (err) {
    console.error('Failed to create recommendation:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Delete recommendation
router.delete('/recommendation/:id', authMiddleware, adminOnly, async (req, res) => {
  const recId = parseInt(req.params.id);
  
  try {
    const filePath = path.join(__dirname, '../../frontend/src/data/recommendations.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    let recommendations = JSON.parse(fileData);
    
    const initialLength = recommendations.length;
    recommendations = recommendations.filter(r => r.id !== recId);
    
    if (recommendations.length === initialLength) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    await fs.writeFile(filePath, JSON.stringify(recommendations, null, 2));

    // Also optionally clean up Recommendation model in DB if it exists
    await Recommendation.deleteOne({ recno: recId });

    res.json({ success: true, message: 'Recommendation deleted successfully' });
  } catch (err) {
    console.error('Failed to delete recommendation:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Allocations API ---

// Get all allocations
router.get('/allocations', authMiddleware, async (req, res) => {
  try {
    const allocations = await Allocation.find().sort({ _id: 1 });
    res.json(allocations);
  } catch (err) {
    console.error('Error fetching allocations:', err);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// Create or update an allocation (by department/month)
router.post('/allocations', authMiddleware, adminOnly, async (req, res) => {
  const { department, rec_ids, month } = req.body;
  if (!department || !rec_ids) {
    return res.status(400).json({ error: 'Missing required department or rec_ids' });
  }
  const targetMonth = month || '2025 Conference';
  try {
    const allocation = await Allocation.findOneAndUpdate(
      { department, month: targetMonth },
      { rec_ids },
      { upsert: true, new: true }
    );
    res.json({ success: true, allocation });
  } catch (err) {
    console.error('Error saving allocation:', err);
    res.status(500).json({ error: 'Failed to save allocation' });
  }
});

// Update an allocation by ID
router.put('/allocations/:id', authMiddleware, adminOnly, async (req, res) => {
  const { department, rec_ids, month } = req.body;
  try {
    const allocation = await Allocation.findByIdAndUpdate(
      req.params.id,
      { department, rec_ids, month },
      { new: true }
    );
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    res.json({ success: true, allocation });
  } catch (err) {
    console.error('Error updating allocation:', err);
    res.status(500).json({ error: 'Failed to update allocation' });
  }
});

// Bulk sync allocations (Caution: Overwrites all existing assignments)
router.post('/allocations/bulk-sync', authMiddleware, adminOnly, async (req, res) => {
  const { allocations } = req.body;
  if (!Array.isArray(allocations)) {
    return res.status(400).json({ error: 'Allocations must be an array' });
  }

  try {
    await Allocation.deleteMany({});
    
    const docs = allocations.map(a => {
      // rec_ids may come in as comma-separated string or array of numbers
      let ids = a.rec_ids;
      if (typeof ids === 'string') {
        ids = ids.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      } else if (Array.isArray(ids)) {
        ids = ids.map(n => parseInt(n)).filter(n => !isNaN(n));
      } else {
        ids = [];
      }
      return {
        department: a.department,
        rec_ids: ids,
        month: a.month || '2025 Conference'
      };
    });

    await Allocation.insertMany(docs);
    res.json({ success: true, count: docs.length });
  } catch (err) {
    console.error('Error in bulk sync:', err);
    res.status(500).json({ error: 'Failed to sync allocations' });
  }
});

// Delete an allocation
router.delete('/allocations/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Allocation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting allocation:', err);
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
});

module.exports = router;