const generateRandomString = require('../../utils/generateRandomString'); // Assuming helper function for random string
const { Op } = require('sequelize');  // Import Op directly from Sequelize
const transformWorkingHours = require('../../utils/transformHours');

// Create Medic
exports.createMedic = async (req, res) => {
  const {
    info: {
      name,
      email,
      employmentType,
      specialization,
      phone,
      address,
      photo, // If a photo is provided
    },
    assignedServices: { assignedTreatments },
    workingHours, // Object with day names as keys and time ranges (e.g., "08:00-16:00") as values
    daysOff, // Array of days off
    permissions, // Array of permissions
  } = req.body;
  
  const password = generateRandomString();
  const pin = generateRandomString(4); // Assuming PIN is 4 characters long

  try {
    const db = req.db;

    // 1. Create a new ClinicUser
    const newUser = await db.ClinicUser.create({
      email,
      name,
      password,
      role: 'medic', // Set the role as 'medic'
      pin,
      subaccount_of: req.userId, // Set this user as a subaccount of the currently logged-in user
      photo: photo || null, // If no photo, set it to null
    });

    // 2. Create a new Medic profile linked to the new ClinicUser
    const newMedic = await db.Medic.create({
      id: newUser.id, // Medic's ID is the same as ClinicUser's ID
      employmentType,
      specialization,
      phone,
      address,
      assignedTreatments, // You can add validations to check for valid treatments
    });

    // 3. Process workingHours object into an array and bulk create
    const workingDaysHours = Object.entries(workingHours).map(([day, hours]) => {
      const [startTime, endTime] = hours.split('-'); // Split the "08:00-16:00" string into startTime and endTime
      return {
        medicId: newMedic.id, // Link to the medic
        day, // Day name (e.g., "Monday")
        startTime,
        endTime,
      };
    });
    if (workingDaysHours.length > 0) {
      await db.WorkingDaysHours.bulkCreate(workingDaysHours);
    }

    // 4. Bulk create days off for the medic
    if (daysOff && daysOff.length > 0) {
      const daysOffData = daysOff.map((dayOff) => ({
        medicId: newMedic.id, // Link to medic
        name: dayOff.name,
        startDate: dayOff.startDate,
        endDate: dayOff.endDate,
        repeatYearly: dayOff.repeatYearly,
      }));
      await db.DaysOff.bulkCreate(daysOffData);
    }

    // 5. Assign permissions to the new medic
    if (permissions && permissions.length > 0) {
      const permissionsToInsert = permissions.map((permission) => ({
        userId: newUser.id, // Link to the new user
        permissionId: permission.id,
        isEnabled: permission.isEnabled,
      }));
      await db.ClinicUserPermission.bulkCreate(permissionsToInsert);
    }

    // 6. Send success response
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



exports.updateMedic = async (req, res) => {
  const {
    email,
    name,
    employmentType,
    specialization,
    phone,
    address,
    assignedTreatments,
    workingHours,
    daysOff,
    permissions,
  } = req.body;

  const db = req.db;

  try {
    // Update ClinicUser
    await db.ClinicUser.update({ email, name }, { where: { id: req.params.id } });

    // Update Medic
    await db.Medic.update(
      { employmentType, specialization, phone, address, assignedTreatments },
      { where: { id: req.params.id } }
    );

    // Transform the workingHours object into an array
    const transformedWorkingHours = transformWorkingHours(workingHours);

    // Extract days from the transformed data
    const incomingDays = transformedWorkingHours.map((entry) => entry.day);

    // Fetch existing working hours for the medic
    const existingWorkingDays = await db.WorkingDaysHours.findAll({
      where: { medicId: req.params.id },
      attributes: ['id', 'day'],
    });

    const existingDays = existingWorkingDays.map((record) => record.day);

    // Identify days to delete (existing days not in the incoming data)
    const daysToDelete = existingDays.filter((day) => !incomingDays.includes(day));

    // Delete unused records
    if (daysToDelete.length > 0) {
      await db.WorkingDaysHours.destroy({
        where: {
          medicId: req.params.id,
          day: { [Op.in]: daysToDelete },
        },
      });
    }

    // Update or insert records
    await Promise.all(
      transformedWorkingHours.map(async (entry) => {
        if (!entry.day || !entry.startTime || !entry.endTime) {
          console.warn('Invalid working hours entry:', entry); // Log invalid entry
          return; // Skip invalid entry
        }
    
        const existingRecord = existingWorkingDays.find((record) => record.day === entry.day);
    
        if (existingRecord) {
          // Update existing record
          await db.WorkingDaysHours.update(
            { startTime: entry.startTime, endTime: entry.endTime },
            { where: { id: existingRecord.id } }
          );
        } else {
          // Create new record
          await db.WorkingDaysHours.create({
            medicId: req.params.id,
            day: entry.day,
            startTime: entry.startTime,
            endTime: entry.endTime,
          });
        }
      })
    );



    // Update Days Off
    await db.DaysOff.destroy({ where: { medicId: req.params.id } });

    if (daysOff.length > 0) {
      await Promise.all(
        daysOff.map((dayOff) =>
          db.DaysOff.create({
            medicId: req.params.id,
            name: dayOff.name,
            startDate: dayOff.startDate,
            endDate: dayOff.endDate,
            repeatYearly: dayOff.repeatYearly,
          })
        )
      );
    }

    // Update Permissions
    await db.ClinicUserPermission.destroy({ where: { userId: req.params.id } });

    if (permissions.length > 0) {
      const permissionsToInsert = permissions.map((permission) => ({
        userId: req.params.id,
        permissionId: permission.id,
        isEnabled: permission.isEnabled,
      }));

      await db.ClinicUserPermission.bulkCreate(permissionsToInsert);
    }

    res.status(200).json({ message: 'Medic updated successfully' });
  } catch (error) {
    console.error('Error updating medic:', error);
    res.status(500).json({ error: 'Failed to update medic' });
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
