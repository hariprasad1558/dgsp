const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const shortUrlStore = new Map();
const codeLength = 7;

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function generateCode(length = codeLength) {
  // URL-safe code from random bytes.
  return crypto.randomBytes(Math.ceil(length * 0.75)).toString('base64url').slice(0, length);
}

function getBaseUrl(req) {
  if (process.env.SHORT_URL_BASE) {
    return process.env.SHORT_URL_BASE.replace(/\/$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
}

router.post('/short-url', (req, res) => {
  const { longUrl } = req.body || {};

  if (!longUrl || typeof longUrl !== 'string') {
    return res.status(400).json({ success: false, message: 'longUrl is required' });
  }

  if (!isValidHttpUrl(longUrl)) {
    return res.status(400).json({ success: false, message: 'longUrl must be a valid http/https URL' });
  }

  let code = generateCode();
  let attempts = 0;

  while (shortUrlStore.has(code) && attempts < 5) {
    code = generateCode();
    attempts += 1;
  }

  if (shortUrlStore.has(code)) {
    return res.status(500).json({ success: false, message: 'Unable to generate short URL code' });
  }

  shortUrlStore.set(code, {
    longUrl,
    createdAt: new Date().toISOString()
  });

  const baseUrl = getBaseUrl(req);
  return res.json({
    success: true,
    code,
    longUrl,
    shortUrl: `${baseUrl}/s/${code}`
  });
});

router.get('/short-url/:code', (req, res) => {
  const { code } = req.params;
  const entry = shortUrlStore.get(code);

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Short URL not found' });
  }

  return res.json({ success: true, code, longUrl: entry.longUrl, createdAt: entry.createdAt });
});

router.get('/s/:code', (req, res) => {
  const { code } = req.params;
  const entry = shortUrlStore.get(code);

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Short URL not found' });
  }

  return res.redirect(302, entry.longUrl);
});

module.exports = router;
