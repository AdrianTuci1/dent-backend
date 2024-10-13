// models/daysOff.js
module.exports = (sequelize, DataTypes) => {
    const DaysOff = sequelize.define('DaysOff', {
      medicId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Medics',
          key: 'id'
        },
        allowNull: false
      },
      name: {
        type: DataTypes.STRING, // e.g., "Vacation"
        allowNull: true
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      repeatYearly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      timestamps: false
    });
    
    return DaysOff;
  };
  