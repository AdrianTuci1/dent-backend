const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];  // Get token from Authorization header

  if (!authHeader) {
    return res.status(403).json({ message: 'No token provided.' });
  }

  // Ensure token has the Bearer prefix
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Malformed token.' });
  }

  // Debugging: Check if JWT_SECRET is loaded
  console.log('JWT_SECRET in middleware:', process.env.JWT_SECRET);  // This should log the secret or undefined

  // Use the environment variable JWT_SECRET or a fallback secret
  const secret = process.env.JWT_SECRET || 'hardcoded_fallback_secret';
  
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      console.log('JWT Verification Error:', err);  // Log the exact error
      return res.status(401).json({ message: 'Failed to authenticate token.' });
    }

    // Attach the decoded user to the request object
    req.user = decoded;
    next();
  });
};

module.exports = authenticate;
