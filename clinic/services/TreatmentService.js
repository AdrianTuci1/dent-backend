const { Op } = require('sequelize');

class TreatmentService {
    constructor(db) {
      this.db = db;
    }
  
    // Helper method to create a single treatment
    async createSingleTreatment(data, transaction) {
      const { name, category, description, duration, price, componentIds, componentUnits, color } = data;
  
      // Find the last treatment and generate the new ID
      const lastTreatment = await this.db.Treatment.findOne({
        order: [['createdAt', 'DESC']],
        transaction,
      });
  
      const lastIdNumber = lastTreatment ? parseInt(lastTreatment.id.slice(1), 10) : 0;
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
  
      // Create TreatmentComponent records
      const treatmentComponents = componentIds.map((componentId, index) => ({
        treatmentId: treatment.id,
        componentId,
        componentsUnits: componentUnits[index],
      }));
  
      await this.db.TreatmentComponent.bulkCreate(treatmentComponents, { transaction });
  
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


    // Fetch all treatments with search and pagination
    async getAllTreatments({ name = '', offset = 0, limit = 20 }) {
        try {
        const treatments = await this.db.Treatment.findAll({
            where: {
            name: {
                [Op.iLike]: `%${name}%`, // Search treatments by name
            },
            },
            limit,
            offset: parseInt(offset, 10),
            order: [['name', 'ASC']], // Sort alphabetically by name
        });

        return {
            treatments,
            limit,
            offset: parseInt(offset, 10) + limit, // Calculate the next offset
        };
        } catch (error) {
        console.error('Error in getAllTreatments:', error);
        throw new Error('Failed to fetch treatments');
        }
    }



      // Update a single treatment by ID
    async updateSingleTreatment(treatmentId, data, transaction) {
        const { name, category, description, duration, price, components, color } = data;

        // Fetch the existing treatment
        const treatment = await this.db.Treatment.findOne({ where: { id: treatmentId }, transaction });
        if (!treatment) {
        throw new Error(`Treatment with ID ${treatmentId} not found`);
        }

        // Validate components array
        if (!Array.isArray(components)) {
        throw new Error('`components` must be an array');
        }

        // Update treatment fields
        await treatment.update(
        { name, category, description, duration, price, color },
        { transaction }
        );

        // Clear the existing component associations
        await this.db.TreatmentComponent.destroy({ where: { treatmentId }, transaction });

        // Prepare the new data for components
        const treatmentComponentsData = components.map((comp) => ({
        treatmentId,
        componentId: comp.id, // Extract `id` for componentId
        componentUnits: comp.componentUnits, // Extract `componentUnits`
        }));

        // Add updated components to the treatment
        await this.db.TreatmentComponent.bulkCreate(treatmentComponentsData, { transaction });

        return treatment;
    }

    // Update multiple treatments
    async updateBatchTreatments(updates) {
        const transaction = await this.db.clinicSequelize.transaction();
        try {
        const updatedTreatments = [];

        for (const update of updates) {
            const { id: treatmentId, ...data } = update; // Extract treatment ID
            const updatedTreatment = await this.updateSingleTreatment(treatmentId, data, transaction);
            updatedTreatments.push(updatedTreatment);
        }

        await transaction.commit();
        return updatedTreatments;
        } catch (error) {
        await transaction.rollback();
        console.error('Error in batch treatment update:', error);
        throw new Error('Failed to update batch treatments');
        }
    }

    // Handle both single and batch updates
    async updateTreatments(updates) {
        if (Array.isArray(updates)) {
        return await this.updateBatchTreatments(updates); // Handle batch updates
        } else {
        // Wrap single update in a transaction
        const transaction = await this.db.clinicSequelize.transaction();
        try {
            const updatedTreatment = await this.updateSingleTreatment(updates.id, updates, transaction);
            await transaction.commit();
            return [updatedTreatment]; // Return as an array for consistency
        } catch (error) {
            await transaction.rollback();
            console.error('Error in single treatment update:', error);
            throw new Error('Failed to update treatment');
        }
        }
    }


  // Delete a single treatment by ID
  async deleteSingleTreatment(treatmentId, transaction) {
    // Fetch the treatment to ensure it exists
    const treatment = await this.db.Treatment.findOne({ where: { id: treatmentId }, transaction });

    if (!treatment) {
      throw new Error(`Treatment with ID ${treatmentId} not found`);
    }

    // Remove associations in the TreatmentComponent table
    await this.db.TreatmentComponent.destroy({ where: { treatmentId }, transaction });

    // Delete the treatment
    await treatment.destroy({ transaction });

    return treatmentId; // Return deleted treatment ID for confirmation
  }

  // Delete multiple treatments by IDs
  async deleteBatchTreatments(treatmentIds) {
    const transaction = await this.db.clinicSequelize.transaction();
    try {
      const deletedIds = [];

      for (const treatmentId of treatmentIds) {
        const deletedId = await this.deleteSingleTreatment(treatmentId, transaction);
        deletedIds.push(deletedId);
      }

      await transaction.commit();
      return deletedIds;
    } catch (error) {
      await transaction.rollback();
      console.error('Error in batch treatment deletion:', error);
      throw new Error('Failed to delete batch treatments');
    }
  }

    // Handle both single and batch deletion
    async deleteTreatments(treatmentIds) {
        if (Array.isArray(treatmentIds)) {
        return await this.deleteBatchTreatments(treatmentIds);
        } else {
        // Wrap single deletion in a transaction
        const transaction = await this.db.clinicSequelize.transaction();
        try {
            const deletedId = await this.deleteSingleTreatment(treatmentIds, transaction);
            await transaction.commit();
            return [deletedId]; // Return as an array for consistency
        } catch (error) {
            await transaction.rollback();
            console.error('Error in single treatment deletion:', error);
            throw new Error('Failed to delete treatment');
        }
        }
    }

    // Get treatment by ID
    async getTreatmentById(treatmentId) {
        // Fetch the treatment data
        const treatment = await this.db.Treatment.findOne({ where: { id: treatmentId } });

        if (!treatment) {
        throw new Error(`Treatment with ID ${treatmentId} not found`);
        }

        // Fetch related components using TreatmentComponent model
        const components = await this.db.TreatmentComponent.findAll({
        where: { treatmentId },
        include: [
            {
            model: this.db.Component,
            as: 'component', // Use the correct alias
            attributes: ['id', 'componentName', 'unitPrice'],
            },
        ],
        attributes: ['treatmentId', 'componentId', 'componentsUnits'],
        });

        // Format the components for the response
        const formattedComponents = components.map((tc) => ({
        id: tc.component.id,
        componentName: tc.component.componentName,
        unitPrice: tc.component.unitPrice,
        componentUnits: tc.componentsUnits,
        }));

        // Combine treatment with components
        return {
        ...treatment.toJSON(),
        components: formattedComponents,
        };
    }
  }
  
  module.exports = TreatmentService;