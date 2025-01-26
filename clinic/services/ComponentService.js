const { Op } = require('sequelize');

class ComponentService {
    constructor(db) {
      this.db = db;
    }
  
    // **Create Component(s)**
    async createComponents(components) {
      const transaction = await this.db.clinicSequelize.transaction();
      try {
        const createdComponents = [];
        for (const component of components) {
          const newComponent = await this.db.Component.create(component, { transaction });
          createdComponents.push(newComponent);
        }
        await transaction.commit();
        return createdComponents;
      } catch (error) {
        await transaction.rollback();
        console.error('Error creating components:', error);
        throw new Error('Failed to create components');
      }
    }
  
    // **Get All Components**
    async getAllComponents({ name = '', offset = 0, limit = 20 }) {
      return await this.db.Component.findAll({
        where: {
          componentName: { [Op.iLike]: `%${name}%` },
        },
        limit,
        offset: parseInt(offset, 10),
        order: [['componentName', 'ASC']],
      });
    }
  
    // **Update Component(s)**
    async updateComponents(components) {
      const transaction = await this.db.clinicSequelize.transaction();
      try {
        const updatedComponents = [];
        for (const component of components) {
          const existingComponent = await this.db.Component.findOne({ where: { id: component.id }, transaction });
          if (!existingComponent) {
            throw new Error(`Component with ID ${component.id} not found`);
          }
  
          await existingComponent.update(component, { transaction });
          updatedComponents.push(existingComponent);
        }
        await transaction.commit();
        return updatedComponents;
      } catch (error) {
        await transaction.rollback();
        console.error('Error updating components:', error);
        throw new Error('Failed to update components');
      }
    }
  
    // **Delete Component(s)**
    async deleteComponents(componentIds) {
      const transaction = await this.db.clinicSequelize.transaction();
      try {
        for (const componentId of componentIds) {
          const component = await this.db.Component.findOne({ where: { id: componentId }, transaction });
          if (!component) {
            throw new Error(`Component with ID ${componentId} not found`);
          }
          await component.destroy({ transaction });
        }
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        console.error('Error deleting components:', error);
        throw new Error('Failed to delete components');
      }
    }
  }
  
  module.exports = ComponentService;
