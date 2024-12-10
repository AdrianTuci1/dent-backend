// Helper function to calculate endHour based on treatment durations
const calculateEndHour = (startTime, treatments) => {
  const [hours, minutes] = startTime.split(':').map(Number);

  const totalMinutes = treatments.reduce((sum, treatment) => {
    // Try to get duration directly or fallback to treatmentDetails.duration
    const duration = treatment.duration || treatment.treatmentDetails?.duration || 0;
    return sum + duration;
  }, 0);

  const endMinutes = hours * 60 + minutes + totalMinutes;
  const endHour = Math.floor(endMinutes / 60).toString().padStart(2, '0');
  const endMinute = (endMinutes % 60).toString().padStart(2, '0');

  return `${endHour}:${endMinute}`;
};

module.exports = { calculateEndHour };
