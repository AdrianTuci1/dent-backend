const generateRandomString = require('../../utils/generateRandomString'); // Assuming helper function for random string
const initializeClinicDatabase = require('../../models/clinicDB');

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


// Create Medic
exports.createMedic = async (req, res) => {
  const {
    email,
    name,
    employmentType,
    specialization,
    phone,
    address,
    assignedTreatments,
    workingDaysHours,
    daysOff,
    permissions,
  } = req.body;
  const password = generateRandomString();
  const pin = generateRandomString(4); // Assuming PIN is 4 characters long
  const clinicDbName = req.headers['x-clinic-db'];

  try {
    const db = await getClinicDatabase(clinicDbName);

    const newUser = await db.ClinicUser.create({
      email,
      name,
      password,
      role: 'medic',
      pin,
      subaccount_of: req.userId,
      photo: null,
    });

    const newMedic = await db.Medic.create({
      id: newUser.id,
      employmentType,
      specialization,
      phone,
      address,
      assignedTreatments,
    });

    await Promise.all(
      workingDaysHours.map(async (day) => {
        await db.WorkingDaysHours.create({
          medicId: newMedic.id,
          day: day.day,
          startTime: day.startTime,
          endTime: day.endTime,
        });
      })
    );

    await Promise.all(
      daysOff.map(async (dayOff) => {
        await db.DaysOff.create({
          medicId: newMedic.id,
          name: dayOff.name,
          startDate: dayOff.startDate,
          endDate: dayOff.endDate,
          repeatYearly: dayOff.repeatYearly,
        });
      })
    );

    const permissionsToInsert = permissions.map((permission) => ({
      userId: newUser.id,
      permissionId: permission.id,
      isEnabled: permission.isEnabled,
    }));

    await db.ClinicUserPermission.bulkCreate(permissionsToInsert);

    res.status(201).json({ message: 'Medic created successfully', newUser, newMedic });
  } catch (error) {
    console.error('Error creating medic:', error);
    res.status(500).json({ error: 'Failed to create medic' });
  }
};


// View Medic
exports.viewMedic = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  
  try {
    const db = await getClinicDatabase(clinicDbName);

    const medic = await db.ClinicUser.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ['password', 'pin', 'createdAt', 'updatedAt'] }, // Exclude fields for ClinicUser
      include: [
        {
          model: db.Medic,
          as: 'medicProfile',
          attributes: { exclude: ['createdAt', 'updatedAt'] }, // Exclude fields for Medic
          include: [
            {
              model: db.WorkingDaysHours,
              as: 'workingDaysHours',
              attributes: { exclude: ['createdAt', 'updatedAt'] }, // Exclude fields for WorkingDaysHours
            },
            {
              model: db.DaysOff,
              as: 'daysOff',
              attributes: { exclude: ['createdAt', 'updatedAt'] }, // Exclude fields for DaysOff
            },
          ],
        },
        {
          model: db.Permission,
          as: 'permissions',
          attributes: ['id', 'name'], // Only include id and name
          through: {
            model: db.ClinicUserPermission,
            attributes: [], // Exclude join table attributes
          },
        },
      ],
    });

    if (!medic) {
      return res.status(404).json({ error: 'Medic not found.' });
    }

    // Map the permissions to include isEnabled directly, checking if ClinicUserPermission is present
    const formattedPermissions = medic.permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      isEnabled: permission.ClinicUserPermission ? permission.ClinicUserPermission.isEnabled : false, // Default to false if undefined
    }));

    // Structure the response to include permissions with isEnabled directly
    const formattedMedic = {
      ...medic.toJSON(),
      permissions: formattedPermissions,
    };

    res.status(200).json(formattedMedic);
  } catch (error) {
    console.error('Error fetching medic:', error);  // Log the error details for debugging
    res.status(500).json({ error: 'Failed to retrieve medic details.' });
  }
};



// Update Medic
exports.updateMedic = async (req, res) => {
  const {
    email,
    name,
    employmentType,
    specialization,
    phone,
    address,
    assignedTreatments,
    workingDaysHours,
    daysOff,
    permissions,
  } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];

  try {
    const db = await getClinicDatabase(clinicDbName);

    await db.ClinicUser.update(
      { email, name },
      {
        where: { id: req.params.id },
      }
    );

    await db.Medic.update(
      {
        employmentType,
        specialization,
        phone,
        address,
        assignedTreatments,
      },
      {
        where: { id: req.params.id },
      }
    );

    // Update Working Days Hours
    await db.WorkingDaysHours.destroy({
      where: { medicId: req.params.id },
    });

    await Promise.all(
      workingDaysHours.map(async (day) => {
        await db.WorkingDaysHours.create({
          medicId: req.params.id,
          day: day.day,
          startTime: day.startTime,
          endTime: day.endTime,
        });
      })
    );

    // Update Days Off
    await db.DaysOff.destroy({
      where: { medicId: req.params.id },
    });

    await Promise.all(
      daysOff.map(async (dayOff) => {
        await db.DaysOff.create({
          medicId: req.params.id,
          name: dayOff.name,
          startDate: dayOff.startDate,
          endDate: dayOff.endDate,
          repeatYearly: dayOff.repeatYearly,
        });
      })
    );

    // Update Permissions
    await db.ClinicUserPermission.destroy({
      where: { userId: req.params.id },
    });

    const permissionsToInsert = permissions.map((permission) => ({
      userId: req.params.id,
      permissionId: permission.id,
      isEnabled: permission.isEnabled,
    }));

    await db.ClinicUserPermission.bulkCreate(permissionsToInsert);

    res.status(200).json({ message: 'Medic updated successfully' });
  } catch (error) {
    console.error('Error updating medic:', error);
    res.status(500).json({ error: 'Failed to update medic' });
  }
};


// Delete Medic
exports.deleteMedic = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Delete associated data first
    await db.WorkingDaysHours.destroy({
      where: { medicId: req.params.id },
    });

    await db.DaysOff.destroy({
      where: { medicId: req.params.id },
    });

    await db.ClinicUserPermission.destroy({
      where: { userId: req.params.id },
    });

    // Delete Medic and ClinicUser entries
    await db.Medic.destroy({
      where: { id: req.params.id },
    });

    await db.ClinicUser.destroy({
      where: { id: req.params.id },
    });

    res.status(200).json({ message: 'Medic deleted successfully' });
  } catch (error) {
    console.error('Error deleting medic:', error);
    res.status(500).json({ error: 'Failed to delete medic' });
  }
};




exports.getAllMedicsForTable = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];

  try {
    const db = await getClinicDatabase(clinicDbName);

    const medics = await db.ClinicUser.findAll({
      where: { role: 'medic' },
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: db.Medic,
          as: 'medicProfile',
          attributes: ['specialization', 'phone', 'employmentType'],
          include: [
            {
              model: db.WorkingDaysHours,
              as: 'workingDaysHours',
              attributes: ['day'],
            },
          ],
        },
      ],
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const formattedMedics = medics.map((medic) => {
      const activeDays = new Set(
        medic.medicProfile?.workingDaysHours.map((dayObj) => dayObj.day) || []
      );

      const formattedWorkingDays = daysOfWeek.map((day) =>
        activeDays.has(day) ? day.charAt(0) : ''
      );

      return {
        id: medic.id,
        name: medic.name,
        email: medic.email,
        specialization: medic.medicProfile?.specialization,
        phone: medic.medicProfile?.phone,
        employmentType: medic.medicProfile?.employmentType,
        workingDays: formattedWorkingDays,
      };
    });

    res.status(200).json(formattedMedics);
  } catch (error) {
    console.error('Error fetching medics:', error);
    res.status(500).json({ error: 'Failed to retrieve medics' });
  }
};
