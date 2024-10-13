// models/workingDaysHours.js
module.exports = (sequelize, DataTypes) => {
    const WorkingDaysHours = sequelize.define('WorkingDaysHours', {
      medicId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Medics',
          key: 'id'
        },
        allowNull: false
      },
      day: {
        type: DataTypes.STRING,
        allowNull: false
      },
      startTime: {
        type: DataTypes.STRING, // Alternatively, you can use TIME
        allowNull: true
      },
      endTime: {
        type: DataTypes.STRING, // Alternatively, you can use TIME
        allowNull: true
      }
    }, {
      timestamps: false
    });
  
    return WorkingDaysHours;
  };
  