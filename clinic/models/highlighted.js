module.exports = (sequelize, DataTypes) => {
    const Highlighted = sequelize.define('Highlighted', {
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
      }
    }, {
      timestamps: true
    });
  
    return Highlighted;
  };