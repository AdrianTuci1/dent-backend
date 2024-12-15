const appointmentsState = new Map();

function getAppointments(subdomain) {
  return appointmentsState.get(subdomain) || [];
}

function setAppointments(subdomain, appointments) {
  appointmentsState.set(subdomain, appointments);
}

function updateAppointment(subdomain, updatedAppointment) {
  const currentAppointments = getAppointments(subdomain);
  const updatedList = currentAppointments.map((appointment) =>
    appointment.appointmentId === updatedAppointment.appointmentId
      ? updatedAppointment
      : appointment
  );
  setAppointments(subdomain, updatedList);
}

function deleteAppointment(subdomain, appointmentId) {
  const currentAppointments = getAppointments(subdomain);
  const updatedList = currentAppointments.filter(
    (appointment) => appointment.appointmentId !== appointmentId
  );
  setAppointments(subdomain, updatedList);
}

module.exports = {
  getAppointments,
  setAppointments,
  updateAppointment,
  deleteAppointment,
};
