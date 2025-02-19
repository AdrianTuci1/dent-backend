const { Op } = require('sequelize');

class TreatmentService {
    constructor(db) {
      this.db = db;
    }
  
    // Helper method to create a single treatment
    async createSingleTreatment(data, transaction) {
      console.log('🛠️ Creating treatment with data:', data);
    
      const { name, category, description, duration, price, componentIds = [], componentUnits = [], color } = data;
    
      // Find the last treatment and generate the new ID
      const lastTreatment = await this.db.Treatment.findOne({
        order: [['id', 'DESC']],
        transaction,
      });
    
      const lastIdNumber = lastTreatment && lastTreatment.id.startsWith('T')
        ? parseInt(lastTreatment.id.substring(1), 10) 
        : 0;
      const newIdNumber = lastIdNumber + 1;
      const newTreatmentId = `T${newIdNumber.toString().padStart(3, '0')}`;
    
    
      // Create the treatment
      const treatment = await this.db.Treatment.create(
        {
          id: newTreatmentId,
          name,
          category,
          description,
          duration,
          price,
          color,
        },
        { transaction }
      );
    
      // ✅ Handle cases where no components are provided
      if (componentIds.length > 0 && componentUnits.length > 0) {
        console.log('🔍 Creating TreatmentComponent records with:', {
          componentIds,
          componentUnits,
        });
    
        if (componentIds.length !== componentUnits.length) {
          console.error('❌ componentIds and componentUnits array length mismatch');
          throw new Error('componentIds and componentUnits must have the same length');
        }
    
        // ✅ Only create TreatmentComponent records if components exist
        const treatmentComponents = componentIds.map((componentId, index) => ({
          treatmentId: treatment.id,
          componentId,
          componentsUnits: componentUnits[index],
        }));
    
        await this.db.TreatmentComponent.bulkCreate(treatmentComponents, { transaction });
      } else {
        console.log('ℹ️ No components provided for this treatment.');
      }
    
      return treatment;
    }
  
    // Create multiple treatments
    async createBatchTreatments(treatments) {
      const transaction = await this.db.clinicSequelize.transaction();
      try {
        const createdTreatments = [];
  
        for (const treatmentData of treatments) {
          const treatment = await this.createSingleTreatment(treatmentData, transaction);
          createdTreatments.push(treatment);
        }
  
        await transaction.commit();
        return createdTreatments;
      } catch (error) {
        await transaction.rollback();
        console.error('Error in batch treatment creation:', error);
        throw new Error('Failed to create batch treatments');
      }
    }
  
    // Create either a single or multiple treatments
    async createTreatments(treatments) {
      if (Array.isArray(treatments)) {
        return await this.createBatchTreatments(treatments); // Handle batch creation
      } else {
        // Wrap single treatment creation in a transaction
        const transaction = await this.db.clinicSequelize.transaction();
        try {
          const treatment = await this.createSingleTreatment(treatments, transaction);
          await transaction.commit();
          return [treatment]; // Return as an array for consistency
        } catch (error) {
          await transaction.rollback();
          console.error('Error in single treatment creation:', error);
          throw new Error('Failed to create treatment');
        }
      }
    }


    async getAllTreatments(name = '') {
      try {
        console.log(`Fetching treatments with name: "${name || 'ALL'}"`);
    
        const whereCondition = name ? { name: { [Op.iLike]: `%${name}%` } } : {};
    
        const treatments = await this.db.Treatment.findAll({
          where: whereCondition,
          order: [['name', 'ASC']], // Sort alphabetically
          include: [
            {
              model: this.db.TreatmentComponent,
              as: 'treatmentComponents', // ✅ Must match association in index.js
              include: [
                {
                  model: this.db.Component,
                  as: 'componentDetails', // ✅ Must match alias in index.js
                  attributes: ['id', 'componentName', 'unitPrice'],
                },
              ],
              attributes: ['componentId', 'componentsUnits'],
            },
          ],
        });
    
        if (!treatments.length) {
          console.log('No treatments found.');
          return [];
        }
    
        // ✅ Transform data into correct format
        return treatments.map((treatment) => ({
          id: treatment.id,
          name: treatment.name,
          price: treatment.price,
          duration: treatment.duration,
          description: treatment.description,
          color: treatment.color,
          category: treatment.category,
          components: treatment.treatmentComponents.map((tc) => ({
            id: tc.componentDetails?.id || null,
            componentName: tc.componentDetails?.componentName || '',
            unitPrice: tc.componentDetails?.unitPrice || 0,
            componentUnits: tc.componentsUnits,
          })),
        }));
      } catch (error) {
        console.error('Error in getAllTreatments:', error);
        throw error;
      }
    }

    // Update a single treatment by ID
    async updateSingleTreatment(treatmentId, data, transaction) {
      if (!treatmentId) {
        console.error('❌ Missing treatment ID in updateSingleTreatment');
        throw new Error('Treatment ID is required for update');
      }
    
      console.log(`🔄 Updating treatment ${treatmentId} with data:`, data); // ✅ Debugging log
    
      const { name, category, description, duration, price, components, color } = data;
      
      // ✅ Ensure the treatment exists before updating
      const treatment = await this.db.Treatment.findOne({ where: { id: treatmentId }, transaction });
    
      if (!treatment) {
        console.error(`❌ Treatment with ID ${treatmentId} not found`);
        throw new Error(`Treatment with ID ${treatmentId} not found`);
      }
    
      if (!Array.isArray(components)) {
        console.error('❌ `components` must be an array');
        throw new Error('`components` must be an array');
      }
    
      // ✅ Update treatment details
      await treatment.update({ name, category, description, duration, price, color }, { transaction });
    
      console.log(`✅ Treatment ${treatmentId} updated. Removing old components...`);
    
      // ✅ Remove old components before inserting new ones
      await this.db.TreatmentComponent.destroy({ where: { treatmentId }, transaction });
    
      // ✅ Insert new component associations if any exist
      if (components.length > 0) {
        const treatmentComponentsData = components.map((comp) => ({
          treatmentId,
          componentId: comp.id,
          componentUnits: comp.componentUnits,
        }));
    
        await this.db.TreatmentComponent.bulkCreate(treatmentComponentsData, { transaction });
    
        console.log(`✅ Treatment ${treatmentId} components updated.`);
      } else {
        console.log(`ℹ️ No components to update for treatment ${treatmentId}.`);
      }
    
      // ✅ Fetch the fully updated treatment with its components
      const updatedTreatment = await this.db.Treatment.findOne({
        where: { id: treatmentId },
        include: [
          {
            model: this.db.TreatmentComponent,
            as: 'treatmentComponents',
            include: [
              {
                model: this.db.Component,
                as: 'componentDetails', // ✅ Ensure correct alias
                attributes: ['id', 'componentName', 'unitPrice'],
              },
            ],
          },
        ],
        transaction,
      });
    
      console.log(`✅ Successfully updated treatment ${treatmentId}:`, updatedTreatment); // ✅ Debugging log
    
      return updatedTreatment;
    }

    // Update multiple treatments
    async updateBatchTreatments(updates) {
      const transaction = await this.db.clinicSequelize.transaction();
      try {
        console.log(`🔄 Updating batch treatments:`, updates); // ✅ Debugging log

        const updatedTreatments = await Promise.all(
          updates.map(({ id: treatmentId, ...data }) =>
            this.updateSingleTreatment(treatmentId, data, transaction)
          )
        );

        await transaction.commit();
        console.log(`✅ Successfully updated batch treatments:`, updatedTreatments); // ✅ Debugging log
        return updatedTreatments;
      } catch (error) {
        await transaction.rollback();
        console.error('❌ Error in batch treatment update:', error);
        throw new Error('Failed to update batch treatments');
      }
    }



    // Handle both single and batch updates
    async updateTreatments(updates) {
      const isBatch = Array.isArray(updates);
      const transaction = await this.db.clinicSequelize.transaction();
      try {
        console.log(`🔄 Handling treatment update:`, updates); // ✅ Debugging log
    
        if (!isBatch && !updates.id) {
          console.error('❌ Missing treatment ID in single update');
          throw new Error('Treatment ID is required for updating a treatment');
        }
    
        const updatedTreatments = isBatch
          ? await this.updateBatchTreatments(updates)
          : [await this.updateSingleTreatment(updates.id, updates, transaction)];
    
        await transaction.commit();
        console.log(`✅ Successfully updated treatments:`, updatedTreatments); // ✅ Debugging log
        return updatedTreatments;
      } catch (error) {
        await transaction.rollback();
        console.error('❌ Error updating treatments:', error);
        throw new Error(isBatch ? 'Failed to update batch treatments' : 'Failed to update treatment');
      }
    }


    // Delete a single treatment by ID without using a transaction
    async deleteSingleTreatment(treatmentId) {
      // Fetch the treatment to ensure it exists
      const treatment = await this.db.Treatment.findOne({ where: { id: treatmentId } });
      if (!treatment) {
        throw new Error(`Treatment with ID ${treatmentId} not found`);
      }

      // Remove associations in the TreatmentComponent table
      // Ensure that the association field 'treatmentId' matches your model definition
      await this.db.TreatmentComponent.destroy({ where: { treatmentId } });

      // Delete the treatment itself
      await treatment.destroy();

      console.log(`✅ Treatment with ID ${treatmentId} deleted successfully.`);
      
      return treatmentId; // Return deleted treatment ID for confirmation
    }

    // Delete multiple treatments by IDs in a batch
    async deleteBatchTreatments(treatmentIds) {
      const transaction = await this.db.clinicSequelize.transaction();
      try {
        const deletedIds = [];

        for (const treatmentId of treatmentIds) {
          const deletedId = await this.deleteSingleTreatment(treatmentId, transaction);
          deletedIds.push(deletedId);
        }

        await transaction.commit();
        console.log(`✅ Batch deletion successful for treatments: ${deletedIds}`);
        return deletedIds;
      } catch (error) {
        await transaction.rollback();
        console.error("Error in batch treatment deletion:", error);
        throw new Error("Failed to delete batch treatments");
      }
    }

    // Handle both single and batch deletion
    async deleteTreatments(treatmentIds) {
      if (Array.isArray(treatmentIds)) {
        return await this.deleteBatchTreatments(treatmentIds);
      } else {
        // Single deletion: wrap in a transaction
        const transaction = await this.db.clinicSequelize.transaction();
        try {
          const deletedId = await this.deleteSingleTreatment(treatmentIds, transaction);
          await transaction.commit();
          console.log(`✅ Single treatment deletion successful for ID: ${deletedId}`);
          return [deletedId]; // Return as an array for consistency
        } catch (error) {
          await transaction.rollback();
          console.error("Error in single treatment deletion:", error);
          throw new Error("Failed to delete treatment");
        }
      }
    }

  }
  
  module.exports = TreatmentService;