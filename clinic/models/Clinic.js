
module.exports = ( sequelize, DataTypes) => {
    const ClinicInfo = sequelize.define("ClinicInfo", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    identifier: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    cover: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT, // Markdown formatted text
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    coordinates: {
        type: DataTypes.JSONB, // Example: { lat: 44.4268, lng: 26.1025 }
        allowNull: false,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
        isEmail: true,
        },
    },
    photos: {
        type: DataTypes.ARRAY(DataTypes.STRING), // Array of image URLs
        allowNull: true,
    },
    highlightedTreatmentCategories: {
        type: DataTypes.JSONB, // Example: [{ name: "Preventive Care", color: "#04f03a" }]
        allowNull: true,
    },
    reviews: {
        type: DataTypes.JSONB, // Example: [{ name: "John Doe", content: "Great service!" }]
        allowNull: true,
    },
    patientsThisMonth: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    totalMedics: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    treatmentsThisMonth: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    timezone: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "UTC",
    },
    language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ro",
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "LEI",
    },
    }, {
    timestamps: true, // createdAt & updatedAt
    tableName: "clinics",
    });

    return ClinicInfo;
}
