// controllers/permissionsController.js
exports.getAllPermissions = async (req, res) => {
    try {
      const db = req.db; // Access the database instance
  
      // Fetch all permissions from the Permissions table
      const permissions = await db.Permission.findAll({
        attributes: ["id", "name"], // Fetch only necessary fields
      });
  
      res.status(200).json(permissions); // Send permissions as a JSON response
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  };