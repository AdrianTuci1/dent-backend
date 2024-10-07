// Protect routes based on role
const authenticateRole = (role) => {
    return (req, res, next) => {
      const userRole = req.user.role;  // Extract role from token
      if (userRole === role) {
        next();  // Allow access
      } else {
        return res.status(403).json({ message: 'Access denied.' });
      }
    };
  };