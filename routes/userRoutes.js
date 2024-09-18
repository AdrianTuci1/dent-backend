const express = require('express');
const { createUser, loginUser } = require('../controllers/mainDB/userController');
const router = express.Router();

router.post('/create-user', createUser);

// Public route for login
router.post('/login', loginUser);

module.exports = router;
