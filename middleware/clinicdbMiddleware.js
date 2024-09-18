const { Sequelize } = require('sequelize');
const db = require('../models');  // Central database models

const clinicDbMiddleware = async (req, res, next) => {
  const clinicSubdomain = req.subdomain;  // Extract subdomain from request (e.g., demo.dentms.ro)

  try {
    // Get the clinic details from the central database
    const clinic = await db.Clinic.findOne({ where: { subdomain: clinicSubdomain } });
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });

    // Create a dynamic connection to the clinic's database
    const clinicSequelize = new Sequelize(`postgres://admin:admin@localhost:5432/${clinic.db_name}`);
    req.db = clinicSequelize;  // Attach the dynamic connection to the request

    next();  // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error in clinicDbMiddleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { clinicDbMiddleware };
