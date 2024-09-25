const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Treatment = sequelize.define('Treatment', {
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
    duration: {
      type: DataTypes.INTEGER, // Duration in minutes
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING, // Hex code or color name
      allowNull: false,
      defaultValue: '#FFFFFF', // Default color if not specified
    },
  }, {
    tableName: 'treatments',  // Explicitly set the table name
  });

  return Treatment;
};
