const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const Otp = require('../models/Otp');

require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const OTP_VALIDITY_MS = 5 * 60 * 1000;
const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;

const SMS_PROVIDER = String(process.env.SMS_PROVIDER || 'bsnl').toLowerCase();

const BSNL_API_URL = process.env.BSNL_API_URL || 'http://sms.nscubes.in/api/send_sms';
const BSNL_METHOD = String(process.env.BSNL_METHOD || 'GET').toUpperCase();
const BSNL_API_ID = process.env.BSNL_API_ID;
const BSNL_API_PASSWORD = process.env.BSNL_API_PASSWORD;
const BSNL_SMS_TYPE = process.env.BSNL_SMS_TYPE || 'Transactional';
const BSNL_TEMPLATE_ID = process.env.BSNL_TEMPLATE_ID;
const BSNL_SENDER_ID = process.env.BSNL_SENDER_ID;
const BSNL_SENDER_IDS = process.env.BSNL_SENDER_IDS;
const BSNL_SENDER_PARAM = process.env.BSNL_SENDER_PARAM || 'sender_id';
const BSNL_ENTITY_ID = process.env.BSNL_ENTITY_ID;
const BSNL_SMS_ENCODING = process.env.BSNL_SMS_ENCODING;
const BSNL_OTP_TEMPLATE = process.env.BSNL_OTP_TEMPLATE || 'Your OTP is {OTP}. It is valid for 5 minutes.';
const BSNL_MOBILE_PARAM = process.env.BSNL_MOBILE_PARAM || 'mobile';

function decodeIfEncoded(value) {
  const raw = String(value || '').trim();
  if (!raw.includes('%')) return raw;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function normalizeBsnlSenderId(senderId) {
  return String(senderId || '').trim().toUpperCase();
}

function getBsnlSenderCandidates() {
  const rawList = String(BSNL_SENDER_IDS || BSNL_SENDER_ID || '');
  const candidates = rawList
    .split(',')
    .map(normalizeBsnlSenderId)
    .filter(Boolean);

  // Keep order but drop duplicates.
  return [...new Set(candidates)];
}

function isValidBsnlSenderFormat(senderId) {
  return /^[A-Z0-9]{6}$/.test(String(senderId || ''));
}

function isInvalidSenderError(status, bodyText) {
  if (status >= 200 && status < 300) {
    return /selected sender is invalid|invalid sender/i.test(bodyText || '');
  }

  return /selected sender is invalid|invalid sender/i.test(bodyText || '');
}

async function sendBsnlRequest(payload) {
  if (BSNL_METHOD === 'POST') {
    const logPayload = { ...payload, api_password: '***' };
    console.log('BSNL POST payload:', JSON.stringify(logPayload));
    return axios.post(BSNL_API_URL, payload, {
      timeout: 10000,
      validateStatus: () => true
    });
  }

  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.append(key, String(value));
    }
  });

  const fullUrl = `${BSNL_API_URL}?${params.toString()}`;
  const logUrl = fullUrl.replace(/(api_password=)[^&]+/, '$1***');
  console.log('BSNL GET URL:', logUrl);

  return axios.get(fullUrl, {
    timeout: 10000,
    validateStatus: () => true
  });
}

function renderOtpTemplate(template, otp) {
  let rendered = String(template || '')
    .replace(/\{OTP\}/g, otp)
    .replace(/\{#numeric#\}/gi, otp)
    .replace(/\(OTP\)/gi, otp)
    .replace(/<OTP>/gi, otp);

  // Guards against truncated env value like "...is {" when # is treated as comment in .env.
  if (/\{$/.test(rendered)) {
    rendered = rendered.replace(/\{$/, otp);
  }

  return rendered;
}

function normalizeMobile(mobile) {
  return String(mobile || '').trim();
}

function toE164(mobile) {
  const cleaned = String(mobile || '').replace(/[^0-9+]/g, '').trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  return `+${cleaned}`;
}

function toIndian10Digit(mobile) {
  const cleaned = String(mobile || '').replace(/\D/g, '');
  if (/^91\d{10}$/.test(cleaned)) return cleaned.slice(2);
  if (/^\d{10}$/.test(cleaned)) return cleaned;
  return cleaned;
}

function isBsnlConfigured() {
  return getMissingBsnlConfigKeys().length === 0;
}

function getMissingBsnlConfigKeys() {
  const senderCandidates = getBsnlSenderCandidates();

  const required = {
    BSNL_API_URL,
    BSNL_API_ID,
    BSNL_API_PASSWORD,
    BSNL_TEMPLATE_ID,
    BSNL_SMS_TYPE,
    BSNL_SENDER_ID: senderCandidates.join(',')
  };

  return Object.entries(required)
    .filter(([, value]) => !String(value || '').trim())
    .map(([key]) => key);
}

async function sendOtpWithBsnl(mobile, otp) {
  if (!isBsnlConfigured()) {
    const missing = getMissingBsnlConfigKeys();
    throw new Error(`BSNL SMS service is not configured. Missing: ${missing.join(', ')}`);
  }

  const message = renderOtpTemplate(BSNL_OTP_TEMPLATE, otp);
  const apiPassword = decodeIfEncoded(BSNL_API_PASSWORD);
  const mobileValue = toIndian10Digit(mobile);
  const senderCandidates = getBsnlSenderCandidates();

  if (!/^\d{10}$/.test(mobileValue)) {
    throw new Error('Mobile number is invalid for BSNL SMS delivery');
  }

  // Most BSNL routes require a registered 6-char sender ID and treat case strictly.
  if (!senderCandidates.length || !senderCandidates.some(isValidBsnlSenderFormat)) {
    throw new Error('Configure BSNL_SENDER_ID or BSNL_SENDER_IDS with at least one registered 6-character sender (e.g., DGCONF)');
  }

  const payload = {
    api_id: BSNL_API_ID,
    api_password: apiPassword,
    sms_type: BSNL_SMS_TYPE,
    template_id: BSNL_TEMPLATE_ID,
    message
  };

  // Send both key variants because providers differ between docs and implementation.
  payload[BSNL_MOBILE_PARAM] = mobileValue;
  payload.mobile = mobileValue;
  payload.number = mobileValue;

  if (BSNL_ENTITY_ID) payload.entity_id = BSNL_ENTITY_ID;
  if (BSNL_SMS_ENCODING) payload.sms_encoding = BSNL_SMS_ENCODING;

  const usableSenders = senderCandidates.filter(isValidBsnlSenderFormat);
  let lastError = null;

  for (const senderId of usableSenders) {
    console.log(`BSNL OTP attempt with sender: ${senderId}`);

    const requestPayload = { ...payload };
    requestPayload[BSNL_SENDER_PARAM] = senderId;
    requestPayload.sender = senderId;
    requestPayload.sender_id = senderId;

    const response = await sendBsnlRequest(requestPayload);
    const bodyText = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data || {});

    if (response.status >= 200 && response.status < 300) {
      if (/error|fail|invalid/i.test(bodyText) && !/success|sent|queued|ok/i.test(bodyText)) {
        if (isInvalidSenderError(response.status, bodyText) && senderId !== usableSenders[usableSenders.length - 1]) {
          continue;
        }

        throw new Error(`BSNL SMS API error: ${bodyText}`);
      }

      return bodyText;
    }

    if (isInvalidSenderError(response.status, bodyText) && senderId !== usableSenders[usableSenders.length - 1]) {
      lastError = new Error(`BSNL SMS HTTP error ${response.status}: ${bodyText}`);
      continue;
    }

    throw new Error(`BSNL SMS HTTP error ${response.status}: ${bodyText}`);
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('No valid BSNL sender ID available to send OTP');
}

function normalizeUserId(userId) {
  return String(userId || '').trim();
}

function maskMobile(mobile) {
  const m = String(mobile || '').trim();
  if (m.length < 4) return '******';
  return `******${m.slice(-4)}`;
}

function signUserToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role,
      state: user.state,
      department: user.department,
      mobile: user.mobile
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userId = email; // In this app, userId is used as the login identifier

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signUserToken(user);

    res.json({ 
      success: true, 
      token, 
      user: {
        userId: user.userId,
        mobile: user.mobile,
        role: user.role,
        state: user.state,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const normalizedUserId = normalizeUserId(req.body.userId);
    const normalizedMobile = normalizeMobile(req.body.mobile);

    let user = null;
    if (normalizedUserId) {
      user = await User.findOne({ userId: normalizedUserId });
    } else if (normalizedMobile) {
      if (!MOBILE_REGEX.test(normalizedMobile)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
      }
      user = await User.findOne({ mobile: normalizedMobile });
    } else {
      return res.status(400).json({ success: false, message: 'userId or mobile is required' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User is not registered' });
    }

    const targetMobile = normalizeMobile(user.mobile);
    if (!MOBILE_REGEX.test(targetMobile)) {
      return res.status(400).json({ success: false, message: 'Registered mobile number is invalid' });
    }

    if (SMS_PROVIDER !== 'bsnl') {
      return res.status(503).json({
        success: false,
        message: 'Unsupported SMS_PROVIDER. Set SMS_PROVIDER=bsnl.'
      });
    }

    if (!isBsnlConfigured()) {
      const missing = getMissingBsnlConfigKeys();
      return res.status(503).json({
        success: false,
        message: `OTP SMS service is not configured. Missing env: ${missing.join(', ')}`
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_VALIDITY_MS);

    await Otp.findOneAndUpdate(
      { mobile: targetMobile },
      { otpHash, expiresAt, used: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpWithBsnl(targetMobile, otp);

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      userId: user.userId,
      maskedMobile: maskMobile(targetMobile)
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    const isSenderRegistrationError = /selected sender is invalid|invalid sender/i.test(String(err && err.message || ''));

    return res.status(500).json({
      success: false,
      message: isSenderRegistrationError
        ? 'OTP service is temporarily unavailable. Please contact admin to verify BSNL sender registration.'
        : (err.message || 'Server error while sending OTP')
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const normalizedUserId = normalizeUserId(req.body.userId);
    const normalizedMobile = normalizeMobile(req.body.mobile);
    const otp = String(req.body.otp || '').trim();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'OTP must be 6 digits' });
    }

    let user = null;
    if (normalizedUserId) {
      user = await User.findOne({ userId: normalizedUserId });
    } else if (normalizedMobile) {
      if (!MOBILE_REGEX.test(normalizedMobile)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
      }
      user = await User.findOne({ mobile: normalizedMobile });
    } else {
      return res.status(400).json({ success: false, message: 'userId or mobile is required' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User is not registered' });
    }

    const userMobile = normalizeMobile(user.mobile);
    if (!MOBILE_REGEX.test(userMobile)) {
      return res.status(400).json({ success: false, message: 'Registered mobile number is invalid' });
    }

    const otpRecord = await Otp.findOne({ mobile: userMobile });
    if (!otpRecord || otpRecord.used) {
      return res.status(400).json({ success: false, message: 'No active OTP found' });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    const valid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    otpRecord.used = true;
    await otpRecord.save();

    const token = signUserToken(user);

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        userId: user.userId,
        mobile: user.mobile,
        role: user.role,
        state: user.state,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error while verifying OTP' });
  }
});

// Admin login — username + password only, no OTP required
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'hari';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ||
  '$2b$10$c3mixTwTYwQz8w7N5.6jYeBke25nen30hbPA6n9DmZ2gFF6CUbb/e'; // bcrypt hash of hari1558

router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  if (String(username).trim() !== ADMIN_USERNAME) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  try {
    const isMatch = await bcrypt.compare(String(password), ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: ADMIN_USERNAME, role: 'admin', state: '', department: 'Administration', mobile: '' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        userId: ADMIN_USERNAME,
        role: 'admin',
        state: '',
        department: 'Administration',
        mobile: ''
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
