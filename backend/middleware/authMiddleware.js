const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = (authHeader.split(' ')[1] || '').trim();

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  // Basic JWT shape check to avoid verify() on obvious bad input.
  if (token.split('.').length !== 3) {
    return res.status(401).json({ error: 'Malformed authorization token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
