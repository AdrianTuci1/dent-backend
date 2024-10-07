const jwt = require('jsonwebtoken');

// Single unified middleware for all users (clinic, subaccount, patient)
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET || 'hardcoded_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Attach user information to request object for access in routes
    req.user = user;
    next();
  });
};

module.exports = authenticate;
