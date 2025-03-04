module.exports = (sequelize, DataTypes) => {
    const Promotion = sequelize.define('Promotion', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      type: {
        type: DataTypes.ENUM('treatment', 'category'),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      discount: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  
    return Promotion;
  };