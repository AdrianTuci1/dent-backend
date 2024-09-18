const db = require('../../models');

// Fetch subaccounts for a clinic
const getSubaccounts = async (req, res) => {
  const clinicId = req.clinicId;  // Get clinicId from JWT token

  try {
    // Find all users (subaccounts) associated with the clinic
    const subaccounts = await db.User.findAll({ where: { clinicId } });

    res.status(200).json(subaccounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subaccounts', error });
  }
};

module.exports = { getSubaccounts };
