// models/ClinicUserPermission.js
module.exports = (sequelize, DataTypes) => {
    const ClinicUserPermission = sequelize.define('ClinicUserPermission', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'ClinicUsers',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        permissionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Permissions',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });

    // Associations will be defined later in the index or another setup file
    return ClinicUserPermission;
};
