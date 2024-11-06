// seedData/createClinicAvailability.js

const createClinicAvailability = async (models, transaction) => {
    const { ClinicAvailability } = models;
  
    // Define a range of dates with unavailable times for the clinic
    const dates = [
      '2024-11-06', '2024-11-07', '2024-11-08', 
      '2024-11-09', '2024-11-10'
    ];
    const unavailablePeriods = [
      { start_time: '12:00', end_time: '13:00' },
      { start_time: '16:00', end_time: '17:00' }
    ];
  
    for (const date of dates) {
      for (const period of unavailablePeriods) {
        await ClinicAvailability.create({
          date,
          start_time: period.start_time,
          end_time: period.end_time,
          available_providers: 0 // Indicate no providers available during this period
        }, { transaction });
      }
    }
  
    console.log('Unavailable clinic periods seeded successfully.');
  };
  
  module.exports = createClinicAvailability;
  