const { Sequelize } = require("sequelize");

const transferClinicData = async (clinic) => {
  try {
    const { id, name, identifier, logo, cover, description, address, coordinates, phoneNumber, email, photos, highlightedTreatmentCategories, timezone, language, currency } = clinic;

    // Connect to the clinic's database
    const clinicSequelize = new Sequelize(`postgres://admin:admin@localhost:5432/${identifier}_db`);

    // Create the `clinic_data` table inside the clinic’s database
    await clinicSequelize.query(`
      CREATE TABLE IF NOT EXISTS clinic_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        identifier VARCHAR(255) UNIQUE NOT NULL,
        logo TEXT,
        cover TEXT,
        description TEXT,
        address TEXT NOT NULL,
        coordinates JSONB NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        photos TEXT[],
        highlighted_treatment_categories JSONB,
        timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
        language VARCHAR(50) NOT NULL DEFAULT 'en',
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert clinic metadata into its specific database
    await clinicSequelize.query(`
      INSERT INTO clinic_data (
        name, identifier, logo, cover, description, address, coordinates, phone_number, 
        email, photos, highlighted_treatment_categories, timezone, language, currency
      ) VALUES (
        :name, :identifier, :logo, :cover, :description, :address, :coordinates, :phoneNumber, 
        :email, :photos, :highlightedTreatmentCategories, :timezone, :language, :currency
      );
    `, {
      replacements: {
        name,
        identifier,
        logo,
        cover,
        description,
        address,
        coordinates: JSON.stringify(coordinates),
        phoneNumber,
        email,
        photos: photos ? JSON.stringify(photos) : null,
        highlightedTreatmentCategories: JSON.stringify(highlightedTreatmentCategories),
        timezone,
        language,
        currency
      }
    });

    console.log(`✅ Clinic data successfully transferred to ${identifier}_db`);
  } catch (error) {
    console.error("❌ Error transferring clinic data:", error);
  }
};

module.exports = { transferClinicData };