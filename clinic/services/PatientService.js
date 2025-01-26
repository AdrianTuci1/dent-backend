const { Op } = require ('sequelize')

class PatientService {
    constructor(db) {
      this.db = db;
    }



    // **Get All Patients with Search and Pagination**
    async getPatients(name= '', offset= 0) {

      if (!this.db || !this.db.ClinicUser) {
        return res.status(500).json({ message: 'Database connection or model not available' });
      }
  
      const limit = 20; // Results limited to 20 per request
  
      // Query clinic users with search and pagination
      const clinicUsers = await this.db.ClinicUser.findAll({
        include: [
          {
            model: this.db.Patient,
            as: 'patientProfile',
            attributes: ['id', 'gender', 'age', 'paymentsMade', 'labels'],
          },
          {
            model: this.db.Appointment,
            as: 'patientAppointments',
            attributes: ['appointmentId', 'date', 'time'],
          },
        ],
        where: {
          name: {
            [Op.iLike]: `%${name}%`, // Search by name (case-insensitive match)
          },
        },
        attributes: ['id', 'name', 'email', 'role', 'photo'],
        limit: limit,
        offset: parseInt(offset), // Offset for "Load More" functionality
      });
  
      const currentTime = new Date();
  
      // Process appointments and build the response data
      const dataWithAppointments = await Promise.all(
        clinicUsers
          .filter(clinicUser => clinicUser.patientProfile) // Include only users with a patient profile
          .map(async clinicUser => {
            const pastAppointments = clinicUser.patientAppointments
              .filter(app => new Date(`${app.date}T${app.time}`) < currentTime)
              .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
  
            const futureAppointments = clinicUser.patientAppointments
              .filter(app => new Date(`${app.date}T${app.time}`) >= currentTime)
              .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + a.time));
  
            let previousAppointment = null;
            let nextAppointment = null;
  
            // Fetch previous appointment's treatment details
            if (pastAppointments[0]) {
              const appointmentTreatment = await this.db.AppointmentTreatment.findOne({
                where: { appointmentId: pastAppointments[0].appointmentId },
              });
  
              if (appointmentTreatment) {
                const treatment = await this.db.Treatment.findOne({
                  where: { id: appointmentTreatment.treatmentId },
                  attributes: ['name', 'color'],
                });
                previousAppointment = {
                  ...pastAppointments[0].dataValues,
                  treatmentName: treatment ? treatment.name : null,
                  color: treatment ? treatment.color : null,
                };
              }
            }
  
            // Fetch next appointment's treatment details
            if (futureAppointments[0]) {
              const appointmentTreatment = await this.db.AppointmentTreatment.findOne({
                where: { appointmentId: futureAppointments[0].appointmentId },
              });
  
              if (appointmentTreatment) {
                const treatment = await this.db.Treatment.findOne({
                  where: { id: appointmentTreatment.treatmentId },
                  attributes: ['name', 'color'],
                });
                nextAppointment = {
                  ...futureAppointments[0].dataValues,
                  treatmentName: treatment ? treatment.name : null,
                  color: treatment? treatment.color : null,
                };
              }
            }
  
            return {
              id: clinicUser.id,
              name: clinicUser.name,
              email: clinicUser.email,
              role: clinicUser.role,
              photo: clinicUser.photo,
              patientProfile: {
                id: clinicUser.patientProfile.id,
                gender: clinicUser.patientProfile.gender,
                age: clinicUser.patientProfile.age,
                paymentsMade: clinicUser.patientProfile.paymentsMade,
                labels: clinicUser.patientProfile.labels,
              },
              previousAppointment,
              nextAppointment,
            };
          })
      );
  
      return { data: dataWithAppointments, limit, offset: parseInt(offset) + limit };
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving clinic users and patients' });
    
    }
  
    // **Create Patient(s)**
    async createPatients(patientsData) {
      const { ClinicUser, Patient } = this.db;
      const createdPatients = [];
  
      for (const data of patientsData) {
        const clinicUser = await ClinicUser.create({
          email: data.email,
          name: data.name,
          password: 'password', // Default password
          role: 'patient',
          photo: data.photo || null,
        });
  
        const patient = await Patient.create({
          id: clinicUser.id,
          age: data.age,
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          address: data.address,
          labels: data.labels,
          notes: data.notes,
          dentalHistory: {},
          files: [],
          paymentsMade: [],
        });
  
        createdPatients.push(patient);
      }
  
      return createdPatients;
    }
  
    // **Update Patient(s)**
    async updatePatients(patientsData) {
      const { ClinicUser, Patient } = this.db;
  
      for (const data of patientsData) {
        const clinicUser = await ClinicUser.findByPk(data.id);
        if (!clinicUser) throw new Error(`Patient with ID ${data.id} not found`);
  
        await clinicUser.update({ name: data.name, photo: data.photo });
  
        await Patient.update(
          {
            age: data.age,
            gender: data.gender,
            phone: data.phone,
            address: data.address,
            labels: data.labels,
            notes: data.notes,
          },
          { where: { id: data.id } }
        );
      }
  
      return { message: 'Patients updated successfully' };
    }
  
    // **Delete Patient(s)**
    async deletePatients(patientIds) {
      const { ClinicUser, Patient } = this.db;
  
      for (const id of patientIds) {
        const clinicUser = await ClinicUser.findByPk(id);
        if (!clinicUser) throw new Error(`Patient with ID ${id} not found`);
  
        await Patient.destroy({ where: { id } });
        await ClinicUser.destroy({ where: { id } });
      }
  
      return { message: 'Patients deleted successfully' };
    }
  
    // **Get Patient by ID**
    async getPatientById(id) {
      const { ClinicUser, Patient } = this.db;
  
      const patient = await ClinicUser.findByPk(id, {
        include: { model: Patient, as: 'patientProfile' },
      });
  
      if (!patient) throw new Error('Patient not found');
      return patient;
    }
  }
  
  module.exports = PatientService;