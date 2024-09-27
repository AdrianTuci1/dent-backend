// middlewares/authenticate.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      clinicId: decoded.clinicId,
    };
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};
