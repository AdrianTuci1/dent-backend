// models/treatmentComponent.js
module.exports = (sequelize, DataTypes) => {
    const TreatmentComponent = sequelize.define('TreatmentComponent', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      treatmentId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Treatments',
          key: 'id',
        },
      },
      componentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Components',
          key: 'id',
        },
      },
      componentsUnits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    });
  
    return TreatmentComponent;
  };
  