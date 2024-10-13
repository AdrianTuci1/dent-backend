const initializeClinicDatabase = require('../../models/clinicDB');  // Import the initializer function

// Cache the initialized connections to avoid re-initializing for every request
const dbCache = {};

const getClinicDatabase = async (clinicDbName) => {
  if (dbCache[clinicDbName]) {
    return dbCache[clinicDbName];
  }

  const clinicDB = initializeClinicDatabase(clinicDbName);
  dbCache[clinicDbName] = clinicDB;

  return clinicDB;
};


exports.getUserPermissions = async (req, res) => {
    const clinicDbName = req.headers['x-clinic-db'];
    const { userId } = req.params;

    if (!clinicDbName) {
        return res.status(400).json({ message: 'Missing clinic database name.' });
    }

    try {
        const db = await getClinicDatabase(clinicDbName);

        // Fetch permissions directly from ClinicUser, specifying the alias 'permissions'
        const user = await db.ClinicUser.findOne({
            where: { id: userId },
            include: [
                {
                    model: db.Permission,
                    as: 'permissions', // This should match the alias in the association
                    attributes: ['id', 'name'],
                    through: { attributes: ['isEnabled'] }
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Format the permissions array
        const permissions = user.permissions.map(permission => ({
            id: permission.id,
            name: permission.name,
            isEnabled: permission.ClinicUserPermission.isEnabled,
        }));

        res.status(200).json(permissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user permissions' });
    }
};



exports.updateUserPermissions = async (req, res) => {
    const clinicDbName = req.headers['x-clinic-db'];
    const { userId } = req.params;
    const { permissions } = req.body; // Array of { permissionId, isEnabled }

    if (!clinicDbName) {
        return res.status(400).json({ message: 'Missing clinic database name.' });
    }

    if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Invalid permissions format' });
    }

    try {
        const db = await getClinicDatabase(clinicDbName);

        const updatePromises = permissions.map(async ({ permissionId, isEnabled }) => {
            // Find or create the specific permission for the user
            const [userPermission] = await db.ClinicUserPermission.findOrCreate({
                where: { userId, permissionId },
                defaults: { isEnabled }
            });

            // If it exists, update it; otherwise, creation is handled by findOrCreate
            if (userPermission) {
                await userPermission.update({ isEnabled });
            }
        });

        await Promise.all(updatePromises);

        res.status(200).json({ message: 'Permissions updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user permissions' });
    }
};
