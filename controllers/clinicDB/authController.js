const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/clinicDB/clinicUser');


// Clinic login
const clinicLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the clinic by username
    const clinic = await db.Clinic.findOne({ where: { username } });
    if (!clinic) {
      return res.status(400).json({ message: 'Clinic not found' });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, clinic.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token for authentication
    const token = jwt.sign({ clinicId: clinic.id, username: clinic.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, message: 'Login successful', clinic });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

module.exports = { clinicLogin };
