// seedData/createPatientRequests.js

const createPatientRequests = async (models, patients, transaction) => {
    const { PatientRequest, ClinicAvailability } = models;
  
    // Sample data for patient requests
    const requests = [
      { patient_id: patients[0].id, requested_date: '2024-11-06', requested_time: '09:00', status: 'pending', reason: 'Routine check-up' },
      { patient_id: patients[1].id, requested_date: '2024-11-07', requested_time: '11:00', status: 'approved', reason: 'Cleaning' },
      { patient_id: patients[2].id, requested_date: '2024-11-08', requested_time: '14:00', status: 'rejected', reason: 'Toothache' }
    ];
  
    // Seed requests into PatientRequest
    for (const request of requests) {
      // Check clinic availability for each request's date
      const clinicAvailability = await ClinicAvailability.findOne({
        where: { date: request.requested_date },
        transaction
      });
  
      if (clinicAvailability) {
        await PatientRequest.create({
          ...request,
          clinic_availability_id: clinicAvailability.id
        }, { transaction });
      }
    }
  
    console.log('Patient requests seeded successfully.');
  };
  
  module.exports = createPatientRequests;
  