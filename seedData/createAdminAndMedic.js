const bcrypt = require('bcryptjs');

const createAdminAndMedic = async (models, transaction) => {
  const { ClinicUser, Permission, ClinicUserPermission, Medic, WorkingDaysHours, DaysOff } = models;

  const hashedPassword = await bcrypt.hash('password', 10);
  const hashedPinAdmin = await bcrypt.hash('0000', 10);
  const hashedPinMedic = await bcrypt.hash('1234', 10);
  const hashedPinMedic2 = await bcrypt.hash('2345', 10); // Pin for second medic
  const hashedPinMedic3 = await bcrypt.hash('3456', 10); // Pin for third medic

  // Step 1: Create Admin User and Subaccount
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

  // Step 2: Create First Medic
  const medicUser = await ClinicUser.create({
    email: 'medic@demo.dentms.ro',
    name: 'Dr. Medic',
    password: hashedPassword,
    role: 'medic',
    pin: hashedPinMedic,
    subaccount_of: adminUser.id,
    photo: 'path/to/medic_photo.jpg',
  }, { transaction });

  const medicProfile = await Medic.create({
    id: medicUser.id,
    employmentType: 'full-time',
    specialization: 'Orthodontics',
    phone: '555-1234',
    address: '456 Dental Rd, Tooth City, USA',
    assignedTreatments: ['Teeth Cleaning', 'Orthodontics'],
  }, { transaction });
  console.log('Medic profile created:', medicProfile.toJSON());

  // Step 3: Create Medic 2
  const medicUser2 = await ClinicUser.create({
    email: 'medic2@demo.dentms.ro',
    name: 'Dr. Medicus',
    password: hashedPassword,
    role: 'medic',
    pin: hashedPinMedic2,
    subaccount_of: adminUser.id,
    photo: 'path/to/medic2_photo.jpg',
  }, { transaction });

  const medicProfile2 = await Medic.create({
    id: medicUser2.id,
    employmentType: 'part-time',
    specialization: 'Periodontics',
    phone: '555-5678',
    address: '789 Dental Rd, Tooth City, USA',
    assignedTreatments: ['Teeth Cleaning', 'Periodontics'],
  }, { transaction });
  console.log('Medic 2 profile created:', medicProfile2.toJSON());

  // Step 4: Create Medic 3
  const medicUser3 = await ClinicUser.create({
    email: 'medic3@demo.dentms.ro',
    name: 'Dr. Dentaline',
    password: hashedPassword,
    role: 'medic',
    pin: hashedPinMedic3,
    subaccount_of: adminUser.id,
    photo: 'path/to/medic3_photo.jpg',
  }, { transaction });

  const medicProfile3 = await Medic.create({
    id: medicUser3.id,
    employmentType: 'full-time',
    specialization: 'Endodontics',
    phone: '555-9876',
    address: '123 Dental Ln, Tooth City, USA',
    assignedTreatments: ['Endodontics', 'Root Canal'],
  }, { transaction });
  console.log('Medic 3 profile created:', medicProfile3.toJSON());

  // Step 5: Seed Permissions for All Medics and Admin Subaccount
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
  await ClinicUserPermission.bulkCreate(createUserPermissions(medicUser2.id, medicEnabledPermissions), { transaction });
  await ClinicUserPermission.bulkCreate(createUserPermissions(medicUser3.id, medicEnabledPermissions), { transaction });
  await ClinicUserPermission.bulkCreate(createUserPermissions(adminSubaccount.id, adminEnabledPermissions), { transaction });
  console.log('Permissions assigned to Medic, Medic 2, Medic 3, and Admin Subaccount users');

  // Step 6: Seed Working Days and Hours for All Medics
  const workingDaysHoursData1 = [
    { medicId: medicProfile.id, day: 'Mon', startTime: '09:00', endTime: '17:00' },
    { medicId: medicProfile.id, day: 'Tue', startTime: '09:00', endTime: '17:00' },
    { medicId: medicProfile.id, day: 'Wed', startTime: '09:00', endTime: '17:00' },
    { medicId: medicProfile.id, day: 'Thu', startTime: '09:00', endTime: '17:00' },
    { medicId: medicProfile.id, day: 'Fri', startTime: '09:00', endTime: '17:00' },
  ];
  await WorkingDaysHours.bulkCreate(workingDaysHoursData1, { transaction });

  const workingDaysHoursData2 = [
    { medicId: medicProfile2.id, day: 'Mon', startTime: '10:00', endTime: '14:00' },
    { medicId: medicProfile2.id, day: 'Wed', startTime: '10:00', endTime: '14:00' },
    { medicId: medicProfile2.id, day: 'Fri', startTime: '10:00', endTime: '14:00' },
  ];
  await WorkingDaysHours.bulkCreate(workingDaysHoursData2, { transaction });

  const workingDaysHoursData3 = [
    { medicId: medicProfile3.id, day: 'Mon', startTime: '08:00', endTime: '16:00' },
    { medicId: medicProfile3.id, day: 'Tue', startTime: '08:00', endTime: '16:00' },
    { medicId: medicProfile3.id, day: 'Thu', startTime: '08:00', endTime: '16:00' },
  ];
  await WorkingDaysHours.bulkCreate(workingDaysHoursData3, { transaction });
  console.log('Working days and hours created for all medics.');

  // Step 7: Seed Days Off for All Medics
  const daysOffData1 = [
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

  const daysOffData2 = [
    { medicId: medicProfile2.id, name: 'Vacation', startDate: '2025-06-15', endDate: '2025-06-25', repeatYearly: false },
  ];

  const daysOffData3 = [
    { medicId: medicProfile3.id, name: 'Family time', startDate: '2025-12-01', endDate: '2025-12-10', repeatYearly: true },
  ];

  await DaysOff.bulkCreate(daysOffData1, { transaction });
  await DaysOff.bulkCreate(daysOffData2, { transaction });
  await DaysOff.bulkCreate(daysOffData3, { transaction });
  console.log('Days off created for all medics.');

  return { adminUser, adminSubaccount, medicUser, medicUser2, medicUser3 };
};

module.exports = createAdminAndMedic;
