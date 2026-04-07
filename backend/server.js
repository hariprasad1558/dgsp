require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const recRoutes = require('./routes/recs');
const adminRoutes = require('./routes/adminRoutes');
const userManagementRoutes = require('./routes/userManagement');
const shortUrlRoutes = require('./routes/shortUrlRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/recs', recRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api', shortUrlRoutes);
app.use('/', shortUrlRoutes);

// static serve front-end build if deployed
app.use(express.static('../frontend/build'));
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please stop the other process and try again.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

bcrypt.hash('yournewpassword', 10).then(console.log);
