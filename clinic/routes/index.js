const express = require('express');
const router = express.Router();
const clinicDatabaseMiddleware = require('../../middleware/clinicdbMiddleware');
const authenticateMiddleware = require('../../middleware/authenticate'); // Import authentication middleware

// Import clinic-specific routes
const authRoutes = require('./authRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const treatmentRoutes = require('./treatmentRoutes');
const categoryRoutes = require('./categoryRoutes');
const componentRoutes = require('./componentRoutes');
const medicRoutes = require('./medicRoutes');
const patientRoutes = require('./patientRoutes');
const requestAppointmentRoutes = require('./requestAppointmentRoutes');
const searchRoutes = require('./searchRoutes');
const dentalHistoryRoutes = require('./dentalHistoryRoutes')
const permissionsRoutes = require('./permissionsRoutes')
const syncRoutes = require('./syncRoutes')
const clinicDataRoutes = require('./clinicRoutes')
const miscRoutes = require('./miscRoutes')

// Apply clinic database middleware globally
router.use(clinicDatabaseMiddleware);

router.use('/clinic', clinicDataRoutes);

// Authenticated routes
router.use('/appointments', authenticateMiddleware, appointmentRoutes);
router.use('/treatments', authenticateMiddleware, treatmentRoutes);

// Public routes (no authentication)
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/components', componentRoutes);
router.use('/medics', medicRoutes);
router.use('/patients', patientRoutes);
router.use('/requests', requestAppointmentRoutes);
router.use('/search', searchRoutes);
router.use('/dentalHistory', dentalHistoryRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/misc', miscRoutes)

router.use('/sync', syncRoutes);


module.exports = router;
