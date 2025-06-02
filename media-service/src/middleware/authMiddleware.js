const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateRequest = (req, res, next) => {
     const authHeader = req.headers['authorization'];
     const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();

  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

module.exports = {authenticateRequest};