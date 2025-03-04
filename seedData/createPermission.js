const createPermissions = async (models, transaction) => {
    const { Permission } = models;
  
    // Step 2: Seed Permissions
    const permissionData = [
      { id: 1, name: 'allAppointments' },
      { id: 2, name: 'editTreatments' },
      { id: 3, name: 'editStock' },
      { id: 4, name: 'editPermissions' },
      { id: 5, name: 'resetOthersPin' },
      { id: 6, name: 'addOthersAppointments' },
      { id: 7, name: 'viewGraph' },
      { id: 8, name: 'editMedics' },
      { id: 9, name: 'viewRecords' },
      { id: 10, name: 'requestAppointment' },
    ];
  
    await Permission.bulkCreate(permissionData, { transaction });
    console.log('✅ Permissions seeded successfully.');
  };
  
  module.exports = createPermissions;