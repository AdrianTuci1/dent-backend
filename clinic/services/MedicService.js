class MedicService {
    constructor(db) {
      this.db = db;
    }
  
    // **Create Medic(s)**
    async createMedics(medicsData, userId) {
      const createdMedics = [];
      const transaction = await this.db.clinicSequelize.transaction();
  
      try {
        for (const medicData of medicsData) {
          const {
            name,
            email,
            employmentType,
            specialization,
            phone,
            address,
            photo,
            assignedTreatments,
            workingHours,
            daysOff,
            permissions,
            password,
            pin = '0000',
          } = medicData;
  
          // Create ClinicUser
          const newUser = await this.db.ClinicUser.create(
            {
              email,
              name,
              password,
              role: 'medic',
              pin,
              subaccount_of: userId,
              photo: photo || null,
            },
            { transaction }
          );
  
          // Create Medic Profile
          const newMedic = await this.db.Medic.create(
            {
              id: newUser.id,
              employmentType,
              specialization,
              phone,
              address,
              assignedTreatments,
            },
            { transaction }
          );
  
          // Add WorkingHours
          if (Array.isArray(workingHours) && workingHours.length > 0) {
            const workingDays = workingHours.map((entry) => ({
              medicId: newMedic.id,
              day: entry.day,
              startTime: entry.startTime,
              endTime: entry.endTime,
            }));
            await this.db.WorkingDaysHours.bulkCreate(workingDays, { transaction });
          }
  
          // Add DaysOff
          if (Array.isArray(daysOff) && daysOff.length > 0) {
            const daysOffEntries = daysOff.map((dayOff) => ({
              medicId: newMedic.id,
              name: dayOff.name,
              startDate: dayOff.startDate,
              endDate: dayOff.endDate,
              repeatYearly: dayOff.repeatYearly,
            }));
            await this.db.DaysOff.bulkCreate(daysOffEntries, { transaction });
          }
  
          // Add Permissions
          if (Array.isArray(permissions) && permissions.length > 0) {
            const permissionsEntries = permissions.map((permission) => ({
              userId: newUser.id,
              permissionId: permission.id,
              isEnabled: permission.isEnabled,
            }));
            await this.db.ClinicUserPermission.bulkCreate(permissionsEntries, { transaction });
          }
  
          createdMedics.push({ medic: newMedic, user: newUser });
        }
  
        await transaction.commit();
        return createdMedics;
      } catch (error) {
        await transaction.rollback();
        console.error('Error creating medic(s):', error);
        throw new Error('Failed to create medic(s)');
      }
    }
  

    // **Update Medic(s)**
    async updateMedics(medicsData) {
      try {
        // Validate the entire input array
        if (!Array.isArray(medicsData) || medicsData.length === 0) {
          throw new Error('Invalid input: medicsData must be a non-empty array.');
        }
    
        for (const medicData of medicsData) {
          const {
            id,
            name,
            email,
            employmentType,
            specialization,
            phone,
            address,
            photo,
            assignedTreatments,
            workingHours,
            daysOff,
            permissions,
          } = medicData;
    
          // Validate `id`
          if (!id) {
            console.error('Invalid medic data:', medicData); // Log the problematic record
            throw new Error('Medic ID is required for updating a medic.');
          }
    
          // Check if the medic exists
          const medicExists = await this.db.ClinicUser.findOne({ where: { id } });
          if (!medicExists) {
            throw new Error(`Medic with ID ${id} not found.`);
          }
    
          // **Update ClinicUser**
          if (name || email || photo) {
            await this.db.ClinicUser.update({ email, name, photo }, { where: { id } });
          }
    
          // **Update Medic Details**
          if (
            employmentType ||
            specialization ||
            phone ||
            address ||
            assignedTreatments
          ) {
            await this.db.Medic.update(
              { employmentType, specialization, phone, address, assignedTreatments },
              { where: { id } }
            );
          }
    
          // **Update WorkingHours**
          if (Array.isArray(workingHours)) {
            await this.db.WorkingDaysHours.destroy({ where: { medicId: id } });
            if (workingHours.length > 0) {
              const workingDays = workingHours.map((entry) => ({
                medicId: id,
                day: entry.day,
                startTime: entry.startTime,
                endTime: entry.endTime,
              }));
              await this.db.WorkingDaysHours.bulkCreate(workingDays);
            }
          }
    
          // **Update DaysOff**
          if (Array.isArray(daysOff)) {
            await this.db.DaysOff.destroy({ where: { medicId: id } });
            if (daysOff.length > 0) {
              const daysOffEntries = daysOff.map((dayOff) => ({
                medicId: id,
                name: dayOff.name,
                startDate: dayOff.startDate,
                endDate: dayOff.endDate,
                repeatYearly: dayOff.repeatYearly,
              }));
              await this.db.DaysOff.bulkCreate(daysOffEntries);
            }
          }
    
          // **Update Permissions**
          if (Array.isArray(permissions)) {
            const existingPermissions = await this.db.ClinicUserPermission.findAll({
              where: { userId: id },
            });
    
            const updatedPermissions = permissions.map((permission) => {
              const existing = existingPermissions.find((p) => p.permissionId === permission.id);
              return {
                userId: id,
                permissionId: permission.id,
                isEnabled: permission.isEnabled,
                ...(existing && { id: existing.id }),
              };
            });
    
            await this.db.ClinicUserPermission.bulkCreate(updatedPermissions, {
              updateOnDuplicate: ['isEnabled'],
            });
          }
        }
    
        console.log('Medics updated successfully');
      } catch (error) {
        console.error('Error updating medic(s):', error.message);
        throw new Error(`Failed to update medic(s): ${error.message}`);
      }
    }
  
    // **Delete Medic(s)**
    async deleteMedics(medicIds) {
      const transaction = await this.db.clinicSequelize.transaction();
  
      try {
        for (const medicId of medicIds) {
          await this.db.WorkingDaysHours.destroy({ where: { medicId }, transaction });
          await this.db.DaysOff.destroy({ where: { medicId }, transaction });
          await this.db.ClinicUserPermission.destroy({ where: { userId: medicId }, transaction });
          await this.db.Medic.destroy({ where: { id: medicId }, transaction });
          await this.db.ClinicUser.destroy({ where: { id: medicId }, transaction });
        }
  
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        console.error('Error deleting medic(s):', error);
        throw new Error('Failed to delete medic(s)');
      }
    }

    // **View Medic by ID**
    async getMedicById(medicId) {
        const medic = await this.db.ClinicUser.findOne({
        where: { id: medicId },
        attributes: { exclude: ['password', 'pin', 'createdAt', 'updatedAt'] },
        include: [
            {
            model: this.db.Medic,
            as: 'medicProfile',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [
                {
                model: this.db.WorkingDaysHours,
                as: 'workingDaysHours',
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
                {
                model: this.db.DaysOff,
                as: 'daysOff',
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
            ],
            },
            {
            model: this.db.Permission,
            as: 'permissions',
            attributes: ['id', 'name'],
            through: { model: this.db.ClinicUserPermission, attributes: ['isEnabled'] },
            },
        ],
        });

        if (!medic) {
        throw new Error('Medic not found');
        }

        // Map permissions to include `isEnabled` directly
        const formattedPermissions = medic.permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        isEnabled: permission.ClinicUserPermission ? permission.ClinicUserPermission.isEnabled : false,
        }));

        return { ...medic.toJSON(), permissions: formattedPermissions };
    }

    // **Get All Medics for Table**
    async getAllMedics() {
        const medics = await this.db.ClinicUser.findAll({
        where: { role: 'medic' },
        attributes: ['id', 'name', 'email'],
        include: [
            {
            model: this.db.Medic,
            as: 'medicProfile',
            attributes: ['specialization', 'phone', 'employmentType'],
            include: [
                {
                model: this.db.WorkingDaysHours,
                as: 'workingDaysHours',
                attributes: ['day'],
                },
            ],
            },
        ],
        });

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Format response for frontend
        return medics.map((medic) => {
        const activeDays = new Set(
            medic.medicProfile?.workingDaysHours.map((dayObj) => dayObj.day) || []
        );

        const formattedWorkingDays = daysOfWeek.map((day) =>
            activeDays.has(day) ? day.charAt(0) : ''
        );

        return {
            id: medic.id,
            name: medic.name,
            email: medic.email,
            specialization: medic.medicProfile?.specialization,
            phone: medic.medicProfile?.phone,
            employmentType: medic.medicProfile?.employmentType,
            workingDays: formattedWorkingDays,
        };
        });
    }
  }
  
  module.exports = MedicService;