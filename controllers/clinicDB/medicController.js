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
  const { email, name, employmentType, specialization, phone, address, assignedTreatments, workingDaysHours, daysOff, pin = '0000' } = req.body;
  const password = generateRandomString();
  const clinicDbName = req.headers['x-clinic-db'];

  const transaction = await sequelize.transaction();
  try {
    const { ClinicUser, Medic, sequelize } = await getClinicDatabase(clinicDbName);
    
    const newUser = await ClinicUser.create({
      email,
      name,
      password,
      role: 'medic',
      pin,
      subaccount_of: req.userId,
      permissions: null,
      photo: null,
    }, { transaction });

    const newMedic = await Medic.create({
      id: newUser.id,
      employmentType,
      specialization,
      phone,
      address,
      assignedTreatments,
      workingDaysHours,
      daysOff,
    }, { transaction });

    await transaction.commit();
    res.status(201).json({ newUser, newMedic });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: 'Failed to create medic.' });
  }
};

// View Medic
exports.viewMedic = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  
  try {
    const { ClinicUser, Medic } = await getClinicDatabase(clinicDbName);

    const medic = await ClinicUser.findOne({
      where: { id: req.params.id },
      include: [{ model: Medic, as: 'medicProfile' }],
    });

    if (!medic) {
      return res.status(404).json({ error: 'Medic not found.' });
    }

    res.status(200).json(medic);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve medic details.' });
  }
};

// Update Medic
exports.updateMedic = async (req, res) => {
  const { email, name, employmentType, specialization, phone, address, assignedTreatments, workingDaysHours, daysOff, pin } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];
  
  try {
    const { ClinicUser, Medic, sequelize } = await getClinicDatabase(clinicDbName);
    const transaction = await sequelize.transaction();

    await ClinicUser.update({ email, name, pin }, {
      where: { id: req.params.id },
      transaction,
    });

    await Medic.update({
      employmentType,
      specialization,
      phone,
      address,
      assignedTreatments,
      workingDaysHours,
      daysOff,
    }, {
      where: { id: req.params.id },
      transaction,
    });

    await transaction.commit();
    res.status(200).json({ message: 'Medic updated successfully.' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: 'Failed to update medic.' });
  }
};

// Delete Medic
exports.deleteMedic = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  
  try {
    const { ClinicUser, Medic, sequelize } = await getClinicDatabase(clinicDbName);
    const transaction = await sequelize.transaction();

    await Medic.destroy({
      where: { id: req.params.id },
      transaction,
    });

    await ClinicUser.destroy({
      where: { id: req.params.id },
      transaction,
    });

    await transaction.commit();
    res.status(200).json({ message: 'Medic deleted successfully.' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: 'Failed to delete medic.' });
  }
};
