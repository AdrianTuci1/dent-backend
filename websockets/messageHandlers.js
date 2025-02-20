
const { calculateEndHour } = require("../utils/calcultateEndHour");
const { calculateCurrentWeek } = require("../utils/dateUtils");
const { Op } = require("sequelize");
const initializeClinicDatabase = require("../clinic/models");
const updateMissedAppointmentsForSocket = require("../clinic/middleware/updateMissedAppointments");

const databaseCache = {}; // Cache pentru conexiunile la baze de date

/**
 * 📌 Returnează baza de date inițializată sau o creează dacă nu există
 */
function getCachedDatabase(subdomain) {
  if (!databaseCache[subdomain]) {
    console.log(`🔄 Inițializare DB pentru subdomeniul: ${subdomain}`);
    databaseCache[subdomain] = initializeClinicDatabase(`${subdomain}_db`);
  } else {
    console.log(`✅ Folosim cache-ul DB pentru subdomeniul: ${subdomain}`);
  }
  return databaseCache[subdomain];
}

/**
 * 📌 Gestionează mesajele primite prin WebSocket
 */
async function handleMessage(ws, message) {
  try {
    const { subdomain } = ws;
    if (!subdomain) {
      console.error("❌ Subdomain is missing in WebSocket connection.");
      ws.send(JSON.stringify({ error: "Subdomain is required." }));
      return;
    }

    console.log(`📩 WebSocket mesaj primit pentru subdomeniul: ${subdomain}`);

    const db = getCachedDatabase(subdomain);
    const { Appointment, ClinicUser, Treatment } = db;

    // Actualizăm rezervările ratate înainte de a procesa mesajele
    await updateMissedAppointmentsForSocket(db);

    // ✅ Verificăm dacă mesajul este valid
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
      if (!parsedMessage || typeof parsedMessage !== "object") {
        throw new Error("Invalid message format.");
      }
    } catch (error) {
      console.error("❌ WebSocket - Eroare la parsarea mesajului:", message);
      ws.send(JSON.stringify({ error: "Invalid WebSocket message format." }));
      return;
    }

    // ✅ Verificăm dacă mesajul conține un "type" și un "action"
    const { type, action, data } = parsedMessage;
    if (!type || !action) {
      console.error(`❌ Mesaj WebSocket invalid: lipsește 'type' sau 'action':`, parsedMessage);
      ws.send(JSON.stringify({ error: "Invalid WebSocket message structure." }));
      return;
    }

    console.log(`✅ Acțiune WebSocket validă: ${action}`);

    // 📌 WebSocket gestionează DOAR vizualizarea programărilor
    if (action === "view") {
      await handleViewAppointments(ws, subdomain, Appointment, ClinicUser, Treatment, data);
    } else {
      console.warn(`⚠️ Acțiune necunoscută WebSocket: ${action}`);
      ws.send(JSON.stringify({ error: `Unknown WebSocket action: ${action}` }));
    }
  } catch (error) {
    console.error(`❌ Eroare la procesarea mesajului WebSocket pentru subdomeniul ${ws.subdomain}:`, error);
    ws.send(JSON.stringify({ error: "Failed to process WebSocket message." }));
  }
}

/**
 * 📌 Gestionăm vizualizarea programărilor
 */
async function handleViewAppointments(ws, subdomain, Appointment, ClinicUser, Treatment, message) {
  try {
    const { startDate, endDate, medicId } = message;
    const currentWeek = await calculateCurrentWeek(subdomain);

    // 📌 Determinăm intervalul de date dorit
    const dateRange = startDate && endDate
      ? { [Op.between]: [startDate, endDate] }
      : { [Op.between]: [currentWeek.startDate, currentWeek.endDate] };

    // 📌 Extragem programările din baza de date
    const appointments = await Appointment.findAll({
      where: {
        date: dateRange,
        ...(medicId && { medicUserId: medicId }),
      },
      include: [
        { model: ClinicUser, as: "medic", attributes: ["id", "name"] },
        { model: ClinicUser, as: "patient", attributes: ["id", "name"] },
        { model: Treatment, as: "treatments", attributes: ["name", "color", "duration"] },
      ],
    });

    // 📌 Formatarea datelor pentru frontend
    const formattedAppointments = appointments.map((appointment) => ({
      appointmentId: appointment.appointmentId,
      status: appointment.status,
      startHour: appointment.time,
      endHour: calculateEndHour(appointment.time, appointment.treatments),
      date: appointment.date,
      patientId: appointment.patient?.id || null,
      medicId: appointment.medic?.id || null,
      patientUser: appointment.patient?.name || "Unknown",
      medicUser: appointment.medic?.name || "Unknown",
      initialTreatment: appointment.treatments[0]?.name || "No treatment",
      color: appointment.treatments[0]?.color || "#FF5733",
    }));

    // 📌 Transmitem datele prin WebSocket
    ws.send(
      JSON.stringify({
        type: 'appointments',
        action: 'view',
        data: formattedAppointments,
      }))
      
  } catch (error) {
    console.error(`❌ Eroare la extragerea programărilor pentru ${subdomain}:`, error);
    ws.send(JSON.stringify({ error: "Failed to fetch appointments." }));
  }
}


module.exports = { handleMessage };