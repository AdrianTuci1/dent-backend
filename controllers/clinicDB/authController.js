const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const initializeClinicDatabase = require('../../models/clinicDB');  // Import the initializer function

// Cache the initialized connections to avoid re-initializing for every request
const dbCache = {};

const getClinicDatabase = async (clinicDbName) => {
  // If the database is already initialized, return it from the cache
  if (dbCache[clinicDbName]) {
    return dbCache[clinicDbName];
  }

  // Initialize the clinic-specific database
  const clinicDB = initializeClinicDatabase(clinicDbName);

  // Cache the initialized database connection for future requests
  dbCache[clinicDbName] = clinicDB;

  return clinicDB;
};

class AuthenticationController {
  // Unified login method
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const clinicDbName = req.headers['x-clinic-db'];  // Use clinicDbName passed in header
  
      if (!clinicDbName) {
        return res.status(400).json({ message: 'Missing clinic database name.' });
      }
  
      // Initialize and cache the clinic-specific database
      const { ClinicUser } = await getClinicDatabase(clinicDbName);
  
      console.log('ClinicUser model:', ClinicUser);  // Debug log
  
      // Find user by email
      const user = await ClinicUser.findOne({ where: { email } });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      console.log('Request password:', password); // Debug log
      console.log('Stored hashed password:', user.password); // Debug log
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      console.log('JWT_SECRET:', process.env.JWT_SECRET); // Debug log for JWT_SECRET
  
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        process.env.JWT_SECRET || 'hardcoded_secret_key', // Use a hardcoded secret for testing
        { expiresIn: '1h' }
      );
  
      // Handle role-specific logic
      if (user.role === 'clinic') {
        // Fetch subaccounts (medics/staff) for the clinic
        const subaccounts = await ClinicUser.findAll({
          where: { subaccount_of: user.id, role: ['medic','admin'] },
          attributes: ['id', 'name', 'photo'], // Return essential info only
        });
  
        return res.status(200).json({
          message: 'Clinic login successful.',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          subaccounts,
        });
      } else if (user.role === 'patient') {
        // Patient login: directly return a successful login response
        return res.status(200).json({
          message: 'Patient login successful.',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      } else if (user.role === 'admin' || user.role === 'medic') {
        // Handle medic and admin login with specific logic if needed
        return res.status(200).json({
          message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} login successful.`,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
  
      // Default case (shouldn't reach here)
      return res.status(403).json({ message: 'Access denied.' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error.', error: error.message });
    }
  }
  

  // Subaccount PIN Verification for medics
  static async subaccountPinLogin(req, res) {
    try {
      const { subaccountId, pin } = req.body;
      const { userId } = req.user; // Extracted from JWT token
      const clinicDbName = req.headers['x-clinic-db'];  // Use clinicDbName passed in header

      if (!clinicDbName) {
        return res.status(400).json({ message: 'Missing clinic database name.' });
      }

      // Initialize and cache the clinic-specific database
      const { ClinicUser } = await getClinicDatabase(clinicDbName);

      // Verify that the subaccount belongs to the clinic user
      const subaccount = await ClinicUser.findOne({
        where: { id: subaccountId, subaccount_of: userId },
      });

      if (!subaccount) {
        return res.status(404).json({ message: 'Subaccount not found.' });
      }

      // Compare PINs
      const isMatch = await bcrypt.compare(pin, subaccount.pin);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid PIN.' });
      }

      // Generate a token for the subaccount (medic)
      const token = jwt.sign(
        {
          userId: subaccount.id,
          role: subaccount.role,
          clinicId: subaccount.clinicId,
        },
        process.env.JWT_SECRET || 'hardcoded_secret_key',
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        message: 'Subaccount login successful.',
        token,
        user: {
          id: subaccount.id,
          name: subaccount.name,
          role: subaccount.role,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error.', error: error.message });
    }
  }
}

module.exports = AuthenticationController;
