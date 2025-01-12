const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
      try {
        const userId = req.user.id; // Assume `req.user` contains the authenticated user's details
        const db = req.db;
  
        // Check if the user has the required permission
        const hasPermission = await db.ClinicUserPermission.findOne({
          where: {
            userId,
            isEnabled: true,
          },
          include: [
            {
              model: db.Permission,
              where: { name: requiredPermission },
              attributes: ["id", "name"],
            },
          ],
        });
  
        if (!hasPermission) {
          return res.status(403).json({ message: "Forbidden: You lack the required permission." });
        }
  
        next();
      } catch (error) {
        console.error("Error checking permission:", error);
        res.status(500).json({ message: "Failed to check permissions" });
      }
    };
  };
  
  module.exports = checkPermission;