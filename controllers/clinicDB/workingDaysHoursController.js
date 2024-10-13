// controllers/workingDaysHoursController.js
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


exports.getWorkingDaysHours = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { medicId } = req.params;

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const workingDaysHours = await db.WorkingDaysHours.findAll({
      where: { medicId },
    });

    res.status(200).json(workingDaysHours);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching working days and hours' });
  }
};

exports.createWorkingDaysHours = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { medicId } = req.params;
  const { day, startTime, endTime } = req.body;

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const workingDay = await db.WorkingDaysHours.create({
      medicId,
      day,
      startTime,
      endTime
    });

    res.status(201).json(workingDay);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating working day and hours' });
  }
};

exports.updateWorkingDaysHours = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { medicId, day } = req.params;
  const { startTime, endTime } = req.body;

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const workingDay = await db.WorkingDaysHours.findOne({
      where: { medicId, day },
    });

    if (!workingDay) {
      return res.status(404).json({ message: 'Working day not found' });
    }

    await workingDay.update({ startTime, endTime });

    res.status(200).json(workingDay);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating working day and hours' });
  }
};

exports.deleteWorkingDaysHours = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { medicId, day } = req.params;

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const workingDay = await db.WorkingDaysHours.findOne({
      where: { medicId, day },
    });

    if (!workingDay) {
      return res.status(404).json({ message: 'Working day not found' });
    }

    await workingDay.destroy();
    res.status(200).json({ message: 'Working day deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting working day and hours' });
  }
};
