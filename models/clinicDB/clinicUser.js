// models/clinicUser.js
module.exports = (sequelize, DataTypes) => {
  const ClinicUser = sequelize.define('ClinicUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('clinic', 'admin', 'medic', 'patient'),
      allowNull: false,
    },
    pin: {
      type: DataTypes.STRING, // Hashed PIN
      allowNull: true,
    },
    subaccount_of: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ClinicUsers',
        key: 'id',
      },
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  // Associations will be defined in models/index.js
  return ClinicUser;
};
