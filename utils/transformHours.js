const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Valid day keys

const transformWorkingHours = (workingHours) => {
  return Object.entries(workingHours)
    .filter(([day, timeRange]) => validDays.includes(day) && timeRange) // Validate day and time range
    .map(([day, timeRange]) => {
      const [startTime, endTime] = timeRange.split('-'); // Split "09:00-17:00" into start and end
      return {
        day,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
      };
    });
};

  module.exports = transformWorkingHours;