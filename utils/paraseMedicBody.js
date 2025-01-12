const parseMedicBody = (body) => {
    const {
      info: {
        name = '',
        email = '',
        employmentType = '',
        specialization = '',
        phone = '',
        address = '',
        photo = '',
      } = {},
      assignedServices: { assignedTreatments = [] } = {},
      workingHours = {}, // Object with day names as keys and time ranges
      daysOff = [], // Array of days off
      permissions = [], // Array of permissions
    } = body;
  
    // Transform workingHours and filter out invalid entries
    const transformedWorkingHours = Object.entries(workingHours)
      .filter(([_, hours]) => {
        const [startTime, endTime] = hours.split('-').map((time) => time.trim());
        return startTime && endTime; // Include only valid time ranges
      })
      .map(([day, hours]) => {
        const [startTime, endTime] = hours.split('-').map((time) => time.trim());
        return { day, startTime, endTime };
      });
  
    console.log('Transformed Working Hours:', transformedWorkingHours);
  
    return {
      name,
      email,
      employmentType,
      specialization,
      phone,
      address,
      photo,
      assignedTreatments,
      workingHours: transformedWorkingHours,
      daysOff,
      permissions,
    };
  };
  
  module.exports = parseMedicBody;