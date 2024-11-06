// seedData/createAvailabilitySlots.js

const createAvailabilitySlots = async (models, medics, transaction) => {
  const { AvailabilitySlots } = models;

  // Define a range of dates for unavailable slots only
  const dates = [
    '2024-11-06', '2024-11-07', '2024-11-08', 
    '2024-11-09', '2024-11-10'
  ];
  const unavailableTimeSlots = [
    { start_time: '11:00', end_time: '12:00' },
    { start_time: '14:00', end_time: '15:00' }
  ];

  for (const medic of medics) {
    for (const date of dates) {
      for (const slot of unavailableTimeSlots) {
        await AvailabilitySlots.create({
          medic_id: medic.id,
          date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: false // Only marking as unavailable
        }, { transaction });
      }
    }
  }

  console.log('Unavailable slots seeded successfully.');
};

module.exports = createAvailabilitySlots;
