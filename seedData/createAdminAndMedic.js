const bcrypt = require('bcrypt');

const createAdminAndMedic = async (models, transaction) => {
  const { ClinicUser, Permission, ClinicUserPermission, Medic, WorkingDaysHours, DaysOff } = models;

  const hashedPassword = await bcrypt.hash('password', 10);
  const hashedPinAdmin = await bcrypt.hash('0000', 10);
  const hashedPinMedic = await bcrypt.hash('1234', 10);

  // Step 1: Create Users
  const adminUser = await ClinicUser.create({
    email: 'admin@demo.dentms.ro',
    name: 'Demo Admin',
    password: hashedPassword,
    role: 'clinic',
    subaccount_of: null,
    photo: 'path/to/admin_photo.jpg',
  }, { transaction });

  const adminSubaccount = await ClinicUser.create({
    email: 'admin_sub@demo.dentms.ro',
    name: 'Admin Subaccount',
    password: hashedPassword,
    role: 'admin',
    pin: hashedPinAdmin,
    subaccount_of: adminUser.id,
    photo: 'path/to/admin_sub_photo.jpg',
  }, { transaction });

  const medicUser = await ClinicUser.create({
    email: 'medic@demo.dentms.ro',
    name: 'Dr. Medic',
    password: hashedPassword,
    role: 'medic',
    pin: hashedPinMedic,
    subaccount_of: adminUser.id,
    photo: 'path/to/medic_photo.jpg',
  }, { transaction });

  console.log('Admin, Admin Subaccount, and Medic users created.');

  // Step 2: Create Medic Profile
  const medicProfile = await Medic.create({
    id: medicUser.id,
    employmentType: 'full-time',
    specialization: 'Orthodontics',
    phone: '555-1234',
    address: '456 Dental Rd, Tooth City, USA',
    assignedTreatments: ['Teeth Cleaning', 'Orthodontics'],
  }, { transaction });
  console.log('Medic profile created:', medicProfile.toJSON());

  // Step 3: Create Permissions
  const permissionData = [
    { name: 'allAppointments', description: 'poate vedea toate rezervările' },
    { name: 'editTreatments', description: 'poate adăuga tratamente' },
    { name: 'editStock', description: 'poate modifica stocul' },
    { name: 'editPermissions', description: 'poate edita permisiunile' },
    { name: 'resetOthersPin', description: 'poate reseta pinul' },
    { name: 'addOthersAppointments', description: 'poate adauga rezervări pentru altcineva' },
    { name: 'viewGraph', description: 'poate vedea grafice' },
    { name: 'editMedics', description: 'poate modifica medicii' },
    { name: 'viewRecords', description: 'vedea propriile rezervări (pacient)' },
    { name: 'requestAppointment', description: 'cere o rezervare' }
  ];
  const permissions = await Permission.bulkCreate(permissionData, { transaction });
  console.log('Permissions seeded.');

  // Assign Permissions to Users
  const medicEnabledPermissions = [
    'allAppointments', 'editTreatments', 'editStock', 'editPermissions', 'resetOthersPin', 
    'addOthersAppointments', 'viewGraph', 'editMedics', 'viewRecords', 'requestAppointment'
  ];
  const adminEnabledPermissions = permissionData.map(p => p.name);

  const createUserPermissions = (userId, enabledPermissions) =>
    permissions.map(permission => ({
      userId,
      permissionId: permission.id,
      isEnabled: enabledPermissions.includes(permission.name),
    }));

  await ClinicUserPermission.bulkCreate(createUserPermissions(medicUser.id, medicEnabledPermissions), { transaction });
  await ClinicUserPermission.bulkCreate(createUserPermissions(adminSubaccount.id, adminEnabledPermissions), { transaction });
  console.log('Permissions assigned to Medic and Admin Subaccount users');

  // Step 4: Seed Working Days and Hours for Medic
  const workingDaysHoursData = [
    { medicId: medicProfile.id, day: 'Mon', startTime: '09:00', endTime: '17:00' },
    { medicId: medicProfile.id, day: 'Tue', startTime: '09:00', endTime: '17:00' },
    { medicId: medicProfile.id, day: 'Wed', startTime: '09:00', endTime: '17:00' },
    { medicId: medicProfile.id, day: 'Thu', startTime: '09:00', endTime: '17:00' },
    { medicId: medicProfile.id, day: 'Fri', startTime: '09:00', endTime: '17:00' },
  ];
  await WorkingDaysHours.bulkCreate(workingDaysHoursData, { transaction });
  console.log('Working days and hours created for medic:', workingDaysHoursData);

  // Seed Days Off for Medic
  const daysOffData = [
    {
      medicId: medicProfile.id,
      name: 'Bali escape',
      startDate: '2025-04-01',
      endDate: '2025-04-10',
      repeatYearly: true,
    },
    {
      medicId: medicProfile.id,
      name: 'Sunday',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      repeatYearly: false,
    },
  ];
  await DaysOff.bulkCreate(daysOffData, { transaction });
  console.log('Days off created for medic:', daysOffData);

  return { adminUser, adminSubaccount, medicUser };
};

module.exports = createAdminAndMedic;
