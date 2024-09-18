require('dotenv').config(); // Load environment variables from .env

module.exports = {
  development: {
    url: process.env.DATABASE_URL, // PostgreSQL connection URL
    dialect: 'postgres',  // Dialect as a string
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL, // PostgreSQL connection URL
    dialect: 'postgres',  // Dialect as a string
    logging: false,
  }
};

