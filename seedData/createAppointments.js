

const createAppointments = async (models, patientUser, medicUser, treatments, transaction) => {

  const { Appointment, AppointmentTreatment } = models;

  const appointmentsData = [
    {
      appointmentId: 'AP0001',
      date: '2024-10-23',
      time: '10:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[0].id,
      medicUser: medicUser.id,
      treatmentId: 'T001',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0002',
      date: '2024-10-24',
      time: '11:30',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[1].id,
      medicUser: medicUser.id,
      treatmentId: 'T002',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0003',
      date: '2024-10-25',
      time: '09:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[3].id,
      medicUser: medicUser.id,
      treatmentId: 'T003',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0004',
      date: '2024-10-25',
      time: '14:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[4].id,
      medicUser: medicUser.id,
      treatmentId: 'T004',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0005',
      date: '2024-10-26',
      time: '15:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[4].id,
      medicUser: medicUser.id,
      treatmentId: 'T005',
      treatmentUnits: 1,
    },
  ];
  
  for (const appointment of appointmentsData) {
    const createdAppointment = await Appointment.create({
      appointmentId: appointment.appointmentId,
      date: appointment.date,
      time: appointment.time,
      isDone: appointment.isDone,
      price: treatments.find(t => t.id === appointment.treatmentId).price,
      isPaid: false,
      status: appointment.status,
      medicUser: appointment.medicUser,
      patientUser: appointment.patientUser,
    }, { transaction });
    console.log('Appointment created:', createdAppointment.toJSON());

    await AppointmentTreatment.create({
      appointmentId: createdAppointment.appointmentId,
      treatmentId: appointment.treatmentId,
      units: appointment.treatmentUnits,
    }, { transaction });

    console.log('Treatment associated with appointment:', createdAppointment.toJSON());
  }
};

module.exports = createAppointments;
