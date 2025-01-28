const { generateAppointmentId } = require('../../utils/generateAppointmentId')
const { Op } = require('sequelize')

class AppointmentService {
    constructor(db) {
      this.db = db;
    }
  
    // **Create Appointment(s)**
    async createAppointments(appointmentsData) {
      const createdAppointments = [];
  
      for (const data of appointmentsData) {
        // Generate a new appointment ID
        const appointmentId = await generateAppointmentId();
  
        // Create appointment
        const appointment = await this.db.Appointment.create({
          appointmentId,
          date: data.date,
          time: data.time,
          medicUser: data.medicId,
          patientUser: data.patientId,
          price: data.price,
          status: 'upcoming',
        });
  
        // Add treatments if provided
        if (data.treatments && data.treatments.length > 0) {
          const treatmentData = data.treatments.map((t) => ({
            appointmentId,
            treatmentId: t.treatmentId,
            units: t.units || 1,
          }));
          await this.db.AppointmentTreatment.bulkCreate(treatmentData);
        }
  
        createdAppointments.push(appointment);
      }
  
      return createdAppointments;
    }
  
    // **Get Appointment by ID**
    async getAppointmentDetails(appointmentId) {
      const appointment = await this.db.Appointment.findOne({
        where: { appointmentId },
        include: [
          {
            model: this.db.ClinicUser,
            as: 'medic',
            attributes: ['id', 'name'],
          },
          {
            model: this.db.ClinicUser,
            as: 'patient',
            attributes: ['id', 'name'],
          },
          {
            model: this.db.AppointmentTreatment,
            as: 'AppointmentTreatments',
            include: {
              model: this.db.Treatment,
              as: 'treatmentDetails',
              attributes: ['id', 'name', 'color'],
            },
          },
        ],
      });
  
      if (!appointment) {
        throw new Error('Appointment not found.');
      }
  
      // Format treatments for response
      const formattedTreatments = appointment.AppointmentTreatments.map((t) => ({
        treatmentId: t.treatmentDetails.id,
        treatmentName: t.treatmentDetails.name,
        color: t.treatmentDetails.color,
        units: t.units,
      }));
  
      return {
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        time: appointment.time,
        isDone: appointment.isDone,
        price: appointment.price,
        isPaid: appointment.isPaid,
        status: appointment.status,
        medicId: appointment.medic.id,
        medicUser: appointment.medic.name || appointment.medic.id,
        patientId: appointment.patient.id,
        patientUser: appointment.patient.name || appointment.patient.id,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        treatmentId: formattedTreatments[0]?.treatmentId || null,
        initialTreatment: formattedTreatments[0]?.treatmentName || null, // Get the first treatment name
        treatments: formattedTreatments, // Include all treatments in the response
      };
    }


    // Update a single appointment
    async updateSingleAppointment(data, transaction) {
      const {
        appointmentId,
        date,
        time,
        medicId,
        patientId,
        price,
        treatments,
        isDone,
        isPaid,
      } = data;

      const appointment = await this.db.Appointment.findOne({ where: { appointmentId }, transaction });

      if (!appointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found.`);
      }

      // Update fields if provided
      if (date) appointment.date = date;
      if (time) appointment.time = time;
      if (medicId) appointment.medicUser = medicId;
      if (patientId) appointment.patientUser = patientId;
      if (price !== undefined) appointment.price = price;
      if (isDone !== undefined) appointment.isDone = isDone;
      if (isPaid !== undefined) appointment.isPaid = isPaid;

      // Update status based on date and time
      if (date || time) {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
        const currentDateTime = new Date();
        if (appointmentDateTime > currentDateTime && !isDone && !isPaid) {
          appointment.status = 'upcoming';
        }
      }

      await appointment.save({ transaction });

      // Update treatments if provided
      if (Array.isArray(treatments)) {
        const existingTreatments = await this.db.AppointmentTreatment.findAll({
          where: { appointmentId },
          transaction,
        });

        const existingTreatmentMap = new Map(
          existingTreatments.map((t) => [`${t.appointmentId}-${t.treatmentId}`, t])
        );

        for (const treatment of treatments) {
          const key = `${appointmentId}-${treatment.treatmentId}`;
          if (existingTreatmentMap.has(key)) {
            const existingTreatment = existingTreatmentMap.get(key);
            if ('units' in treatment) existingTreatment.units = treatment.units;
            if ('involvedTeeth' in treatment) existingTreatment.involvedTeeth = treatment.involvedTeeth;
            if ('prescription' in treatment) existingTreatment.prescription = treatment.prescription;
            if ('details' in treatment) existingTreatment.details = treatment.details;
            await existingTreatment.save({ transaction });
            existingTreatmentMap.delete(key);
          } else {
            // Create new treatment
            await this.db.AppointmentTreatment.create(
              {
                appointmentId,
                treatmentId: treatment.treatmentId,
                units: treatment.units || 1,
                involvedTeeth: treatment.involvedTeeth || [],
                prescription: treatment.prescription || '',
                details: treatment.details || '',
              },
              { transaction }
            );
          }
        }

        // Remove treatments not in the updated list
        for (const [, existingTreatment] of existingTreatmentMap.entries()) {
          await existingTreatment.destroy({ transaction });
        }
      }

      return appointment;
    }

    // Update multiple appointments
    async updateAppointments(appointmentsData) {
      const transaction = await this.db.clinicSequelize.transaction();
      try {
        const updatedAppointments = [];

        for (const data of appointmentsData) {
          const updatedAppointment = await this.updateSingleAppointment(data, transaction);
          updatedAppointments.push(updatedAppointment);
        }

        await transaction.commit();
        return updatedAppointments;
      } catch (error) {
        await transaction.rollback();
        throw new Error(`Failed to update appointments: ${error.message}`);
      }
    }


    // **Delete Appointment(s)**
    async deletedAppointments(appointmentIds) {
        const deletedAppointments = [];

        for (const appointmentId of appointmentIds) {
        const appointment = await this.db.Appointment.findOne({ where: { appointmentId } });
        if (!appointment) {
            throw new Error(`Appointment with ID ${appointmentId} not found.`);
        }

        // Remove related treatments
        await this.db.AppointmentTreatment.destroy({ where: { appointmentId } });

        // Delete the appointment
        await appointment.destroy();
        deletedAppointments.push(appointmentId);
        }

        return deletedAppointments;
    }



        // **Get Patient Appointments**
    async getPatientAppointments(patientId, limit = 20, offset = 0) {
        const appointments = await this.db.Appointment.findAll({
        where: { patientUser: patientId },
        order: [['date', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
            {
            model: this.db.ClinicUser,
            as: 'medic',
            attributes: ['id', 'name'],
            },
            {
            model: this.db.AppointmentTreatment,
            as: 'AppointmentTreatments',
            include: [
                {
                model: this.db.Treatment,
                as: 'treatmentDetails',
                attributes: ['name', 'color'],
                },
            ],
            },
        ],
        });

        return appointments.map((appointment) => ({
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        time: appointment.time,
        medicUser: {
            id: appointment.medic?.id,
            name: appointment.medic?.name,
        },
        initialTreatment: appointment.AppointmentTreatments[0]?.treatmentDetails?.name || null,
        color: appointment.AppointmentTreatments[0]?.treatmentDetails?.color || '#4287f5',
        }));
    }

    // **Get Medic Appointments**
    async getMedicAppointments(medicId, today, limit = 10) {
        const whereCondition = {
        date: { [Op.gte]: today },
        };

        if (medicId) {
        whereCondition.medicUser = medicId;
        }

        const appointments = await this.db.Appointment.findAll({
        where: whereCondition,
        include: [
            {
            model: this.db.ClinicUser,
            as: 'medic',
            attributes: ['id', 'name'],
            },
            {
            model: this.db.ClinicUser,
            as: 'patient',
            attributes: ['id', 'name'],
            },
            {
            model: this.db.AppointmentTreatment,
            as: 'AppointmentTreatments',
            include: {
                model: this.db.Treatment,
                as: 'treatmentDetails',
                attributes: ['name', 'color'],
            },
            },
        ],
        limit: parseInt(limit),
        order: [['date', 'ASC'], ['time', 'ASC']],
        });

        return appointments.map((appointment) => ({
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        time: appointment.time,
        patientUser: {
            id: appointment.patient?.id,
            name: appointment.patient?.name,
        },
        medicUser: {
            id: appointment.medic?.id,
            name: appointment.medic?.name,
        },
        initialTreatment: appointment.AppointmentTreatments[0]?.treatmentDetails?.name || null,
        color: appointment.AppointmentTreatments[0]?.treatmentDetails?.color || '#34abeb',
        }));
    }
  }
  
  module.exports = AppointmentService;