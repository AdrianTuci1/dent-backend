const generateRandomString = require('../../utils/generateRandomString'); // Assuming helper function for random string
const parseMedicBody = require('../../utils/paraseMedicBody')

// Create Medic
exports.createMedic = async (req, res) => {
  const {
    name,
    email,
    employmentType,
    specialization,
    phone,
    address,
    photo,
    assignedTreatments,
    workingHours,
    daysOff,
    permissions,
  } = parseMedicBody(req.body);

  const password = generateRandomString();
  const pin = '0000'; // Assuming PIN is 4 characters long

  try {
    const db = req.db;

    // 1. Create ClinicUser
    const newUser = await db.ClinicUser.create({
      email,
      name,
      password,
      role: 'medic', // Set the role as 'medic'
      pin,
      subaccount_of: req.userId, // Link to the currently logged-in user
      photo: photo || null, // Default photo if none provided
    });

    // 2. Create Medic Profile
    const newMedic = await db.Medic.create({
      id: newUser.id, // Use ClinicUser ID as Medic ID
      employmentType,
      specialization,
      phone,
      address,
      assignedTreatments,
    });

    // 3. Add WorkingHours
    if (workingHours.length > 0) {
      await db.WorkingDaysHours.bulkCreate(
        workingHours.map((entry) => ({
          medicId: newMedic.id,
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
        }))
      );
    }

    // 4. Add DaysOff
    if (daysOff.length > 0) {
      await db.DaysOff.bulkCreate(
        daysOff.map((dayOff) => ({
          medicId: newMedic.id,
          name: dayOff.name,
          startDate: dayOff.startDate,
          endDate: dayOff.endDate,
          repeatYearly: dayOff.repeatYearly,
        }))
      );
    }

    // 5. Add Permissions
    if (permissions.length > 0) {
      await db.ClinicUserPermission.bulkCreate(
        permissions.map((permission) => ({
          userId: newUser.id,
          permissionId: permission.id,
          isEnabled: permission.isEnabled,
        }))
      );
    }

    // 6. Return success response
    res.status(201).json({
      message: 'Medic created successfully',
      medic: {
        id: newMedic.id,
        name: newUser.name,
        email: newUser.email,
        employmentType: newMedic.employmentType,
        specialization: newMedic.specialization,
      },
    });
  } catch (error) {
    console.error('Error creating medic:', error);
    res.status(500).json({ error: 'Failed to create medic' });
  }
};

// View Medic
exports.viewMedic = async (req, res) => {
  
  try {
    const db = req.db;

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
          attributes: ['id'], // Only include id and name
          through: {
            model: db.ClinicUserPermission,
            attributes: ['isEnabled'],
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
    name,
    email,
    employmentType,
    specialization,
    phone,
    address,
    photo,
    assignedTreatments,
    workingHours,
    daysOff,
    permissions,
  } = parseMedicBody(req.body);

  const medicId = req.params.id;

  try {
    const db = req.db;

    // 1. Validate Medic ID
    const medicExists = await db.ClinicUser.findOne({ where: { id: medicId } });
    if (!medicExists) {
      return res.status(404).json({ error: "Medic not found" });
    }

    // 2. Update ClinicUser
    const clinicUserUpdated = await db.ClinicUser.update(
      { email, name, photo },
      { where: { id: medicId } }
    );

    if (!clinicUserUpdated[0]) {
      return res.status(404).json({ error: "Failed to update ClinicUser" });
    }

    // 3. Update Medic Details
    const medicUpdated = await db.Medic.update(
      { employmentType, specialization, phone, address, assignedTreatments },
      { where: { id: medicId } }
    );

    if (!medicUpdated[0]) {
      return res.status(404).json({ error: "Failed to update Medic details" });
    }

    // 4. Update WorkingDaysHours
    await db.WorkingDaysHours.destroy({ where: { medicId } });
    if (Array.isArray(workingHours) && workingHours.length > 0) {
      const workingDays = workingHours.map((entry) => ({
        medicId,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
      }));
      await db.WorkingDaysHours.bulkCreate(workingDays);
    }

    // 5. Update DaysOff
    await db.DaysOff.destroy({ where: { medicId } });
    if (Array.isArray(daysOff) && daysOff.length > 0) {
      const daysOffEntries = daysOff.map((dayOff) => ({
        medicId,
        name: dayOff.name,
        startDate: dayOff.startDate,
        endDate: dayOff.endDate,
        repeatYearly: dayOff.repeatYearly,
      }));
      await db.DaysOff.bulkCreate(daysOffEntries);
    }

    // Fetch existing permissions
    const existingPermissions = await db.ClinicUserPermission.findAll({
      where: { userId: medicId },
    });
  

    // Prepare permissions for upsert
    const updatedPermissions = permissions.map((permission) => {
      const existing = existingPermissions.find(
        (p) => p.permissionId === permission.id
      );
      return {
        userId: medicId,
        permissionId: permission.id,
        isEnabled: permission.isEnabled,
        ...(existing && { id: existing.id }), // Include `id` if exists
      };
    });


    // Upsert permissions
    try {
      await db.ClinicUserPermission.bulkCreate(updatedPermissions, {
        updateOnDuplicate: ["isEnabled"],
      });
      console.log("Permissions updated successfully");
    } catch (error) {
      console.error("Error during bulkCreate:", error);
    }

    // Send success response
    res.status(200).json({ message: "Medic updated successfully" });
  } catch (error) {
    console.error("Error updating medic:", error);
    res.status(500).json({ error: "Failed to update medic" });
  }
};


// Delete Medic
exports.deleteMedic = async (req, res) => {

  try {
    const db = req.db;

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

  try {
    const db = req.db;

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
