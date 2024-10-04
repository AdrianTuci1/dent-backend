const jwt = require('jsonwebtoken');

const authenticateSubaccount = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Get token from the Authorization header

  if (!token) {
    return res.status(401).json({ message: 'Subaccount token required.' });
  }

  try {
    // Verify the subaccount token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hardcoded_secret_key');

    // Ensure that the decoded token contains subaccount info (userId and clinicId)
    if (!decoded.userId) {
      return res.status(403).json({ message: 'Invalid subaccount token.' });
    }

    // Attach decoded subaccount info to the request for use in downstream controllers
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized subaccount access.' });
  }
};

module.exports = authenticateSubaccount;
