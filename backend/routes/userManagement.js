const express = require('express');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const User = require('../models/User');

const router = express.Router();

const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;

// GET /api/users - list all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0, __v: 0 }).sort({ createdAt: -1 });
    return res.json({ success: true, users });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
});

function normalizeMobile(mobile) {
  return String(mobile || '').trim();
}

router.post('/add', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, password, role, department, state, mobile } = req.body;
    const normalizedMobile = normalizeMobile(mobile);

    const isAdmin = role === 'admin';
    if (!userId || !password || !normalizedMobile) {
      return res.status(400).json({ success: false, message: 'userId, password and mobile are required' });
    }
    if (!isAdmin && !department) {
      return res.status(400).json({ success: false, message: 'Department / Organisation is required for non-admin users' });
    }

    if (!MOBILE_REGEX.test(normalizedMobile)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
    }

    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or user' });
    }

    const existingUser = await User.findOne({
      $or: [{ userId: String(userId).trim() }, { mobile: normalizedMobile }]
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User ID or mobile already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId: String(userId).trim(),
      mobile: normalizedMobile,
      password: hashedPassword,
      role: role || 'user',
      department: department ? String(department).trim() : '',
      state: state ? String(state).trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'User added successfully',
      user: {
        userId: user.userId,
        mobile: user.mobile,
        role: user.role,
        department: user.department,
        state: user.state
      }
    });
  } catch (error) {
    console.error('Add user error:', error);
    return res.status(500).json({ success: false, message: 'Server error while adding user' });
  }
});

router.delete('/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim();

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    if (req.user.userId === userId) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete own account' });
    }

    const deletedUser = await User.findOneAndDelete({ userId });

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting user' });
  }
});

module.exports = router;
