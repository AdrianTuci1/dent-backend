// controllers/daysOffController.js
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


exports.getDaysOff = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { medicId } = req.params;

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const daysOff = await db.DaysOff.findAll({
      where: { medicId },
    });

    res.status(200).json(daysOff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching days off' });
  }
};

exports.createDayOff = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { medicId } = req.params;
  const { name, startDate, endDate, repeatYearly } = req.body;

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const dayOff = await db.DaysOff.create({
      medicId,
      name,
      startDate,
      endDate,
      repeatYearly
    });

    res.status(201).json(dayOff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating day off' });
  }
};

exports.updateDayOff = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { medicId, dayOffId } = req.params;
  const { name, startDate, endDate, repeatYearly } = req.body;

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const dayOff = await db.DaysOff.findOne({
      where: { id: dayOffId, medicId },
    });

    if (!dayOff) {
      return res.status(404).json({ message: 'Day off not found' });
    }

    await dayOff.update({ name, startDate, endDate, repeatYearly });

    res.status(200).json(dayOff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating day off' });
  }
};

exports.deleteDayOff = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { medicId, dayOffId } = req.params;

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const dayOff = await db.DaysOff.findOne({
      where: { id: dayOffId, medicId },
    });

    if (!dayOff) {
      return res.status(404).json({ message: 'Day off not found' });
    }

    await dayOff.destroy();
    res.status(200).json({ message: 'Day off deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting day off' });
  }
};
