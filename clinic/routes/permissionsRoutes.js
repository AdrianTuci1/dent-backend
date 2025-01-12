// routes/permissionsRoutes.js
const express = require("express");
const { getAllPermissions } = require("../controllers/permissionsController");

const router = express.Router();

// Route to fetch all permissions
router.get("/", getAllPermissions);

module.exports = router;