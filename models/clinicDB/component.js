const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Component = sequelize.define('Component', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'components',  // Explicitly set the table name
  });

  return Component;
};
