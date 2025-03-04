const createAppointments = async (models, patientUser, medicUser, medicUser2, medicUser3, treatments, transaction) => {
  const { Appointment, AppointmentTreatment } = models;

  // Helper function to generate dynamic appointments
  const generateDynamicAppointments = (numAppointments = 30) => {
    const startDate = new Date(); // Today's date
    const appointments = [];
    const maxAppointmentsPerDay = 3;
    const patientUserIds = patientUser.map((p) => p.id);
    const medicUserIds = [medicUser.id, medicUser2.id, medicUser3.id];
    const treatmentIds = Array.from({ length: 17 }, (_, i) => `T${String(i + 1).padStart(3, "0")}`);

    let currentDate = new Date(startDate);
    let appointmentsToday = 0;

    for (let i = 0; i < numAppointments; i++) {
      if (appointmentsToday >= maxAppointmentsPerDay) {
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        appointmentsToday = 0;
      }

      const appointment = {
        appointmentId: `AP${String(i + 1).padStart(4, "0")}`,
        date: currentDate.toISOString().split("T")[0], // Format YYYY-MM-DD
        time: `${String(Math.floor(Math.random() * 9) + 8).padStart(2, '0')}:00`, // Ensures HH:mm format
        isDone: false,
        status: "upcoming",
        patientUser: patientUserIds[Math.floor(Math.random() * patientUserIds.length)],
        medicUser: medicUserIds[Math.floor(Math.random() * medicUserIds.length)],
        treatmentId: treatmentIds[Math.floor(Math.random() * treatmentIds.length)],
        treatmentUnits: 1,
      };

      appointments.push(appointment);
      appointmentsToday++;
    }

    return appointments;
  };

  const appointmentsData = generateDynamicAppointments(30); // Generate 30 dynamic appointments

  for (const appointment of appointmentsData) {
    const createdAppointment = await Appointment.create(
      {
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        time: appointment.time,
        isDone: appointment.isDone,
        price: treatments.find((t) => t.id === appointment.treatmentId).price,
        isPaid: false,
        status: appointment.status,
        medicUser: appointment.medicUser,
        patientUser: appointment.patientUser,
      },
      { transaction }
    );
    console.log("Appointment created:", createdAppointment.toJSON());

    await AppointmentTreatment.create(
      {
        appointmentId: createdAppointment.appointmentId,
        treatmentId: appointment.treatmentId,
        units: appointment.treatmentUnits,
      },
      { transaction }
    );

    console.log("Treatment associated with appointment:", createdAppointment.toJSON());
  }
};

module.exports = createAppointments;