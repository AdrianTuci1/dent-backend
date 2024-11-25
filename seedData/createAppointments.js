

const createAppointments = async (models, patientUser, medicUser, medicUser2, medicUser3, treatments, transaction) => {

  const { Appointment, AppointmentTreatment } = models;

  const appointmentsData = [
    {
      appointmentId: 'AP0001',
      date: '2024-11-20',
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
      date: '2024-11-19',
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
      date: '2024-11-21',
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
      date: '2024-11-24',
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
      date: '2024-11-25',
      time: '15:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[4].id,
      medicUser: medicUser.id,
      treatmentId: 'T005',
      treatmentUnits: 1,
    },
        // Appointments for medicUser2
    {
      appointmentId: 'AP0006',
      date: '2024-11-26',
      time: '09:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[0].id,
      medicUser: medicUser2.id,
      treatmentId: 'T001',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0007',
      date: '2024-11-27',
      time: '12:30',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[1].id,
      medicUser: medicUser2.id,
      treatmentId: 'T002',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0008',
      date: '2024-11-27',
      time: '10:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[2].id,
      medicUser: medicUser2.id,
      treatmentId: 'T003',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0009',
      date: '2024-11-28',
      time: '14:30',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[3].id,
      medicUser: medicUser2.id,
      treatmentId: 'T004',
      treatmentUnits: 1,
    },
    // Appointments for medicUser3
    {
      appointmentId: 'AP0010',
      date: '2024-11-29',
      time: '08:30',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[0].id,
      medicUser: medicUser3.id,
      treatmentId: 'T001',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0011',
      date: '2024-11-26',
      time: '11:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[2].id,
      medicUser: medicUser3.id,
      treatmentId: 'T003',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0012',
      date: '2024-11-30',
      time: '09:00',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[3].id,
      medicUser: medicUser3.id,
      treatmentId: 'T004',
      treatmentUnits: 1,
    },
    {
      appointmentId: 'AP0013',
      date: '2024-11-28',
      time: '14:30',
      isDone: false,
      status: 'upcoming',
      patientUser: patientUser[4].id,
      medicUser: medicUser3.id,
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
