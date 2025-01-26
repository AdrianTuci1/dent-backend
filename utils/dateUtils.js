const { Op } = require('sequelize');
const moment = require('moment-timezone');
const { Clinic, syncMainDatabase } = require('../main/models');

/**
 * Fetch the clinic's timezone from the main database based on the subdomain
 * @param {string} subdomain - The clinic's subdomain
 * @returns {Promise<string>} - Returns the timezone string
 */
    // Function to get clinic timezone
    async function getClinicTimezone(subdomain) {
        await syncMainDatabase(); // Ensure database is synced
        
        const clinic = await Clinic.findOne({
        where: { subdomain },
        attributes: ['timezone'],
        });
    
        if (!clinic || !clinic.timezone) {
        throw new Error('Clinic not found or timezone missing.');
        }
    
        return clinic.timezone;
    }

/**
 * Calculate the start and end dates of the current week based on the clinic's timezone
 * @param {string} subdomain - The clinic's subdomain
 * @returns {Promise<{startDate: string, endDate: string}>} - The start and end dates of the current week in YYYY-MM-DD format
 */
async function calculateCurrentWeek(subdomain) {
  try {
    // Fetch the clinic's timezone
    const timezone = await getClinicTimezone(subdomain);

    // Get the current date in the clinic's timezone
    const currentDate = moment.tz(timezone);

    // Calculate the start of the week (Monday)
    const startOfWeek = currentDate.clone().startOf('isoWeek');

    // Calculate the end of the week (Sunday)
    const endOfWeek = currentDate.clone().endOf('isoWeek');

    // Format the dates to 'YYYY-MM-DD'
    return {
      startDate: startOfWeek.format('YYYY-MM-DD'),
      endDate: endOfWeek.format('YYYY-MM-DD'),
    };
  } catch (error) {
    console.error('Error calculating current week:', error);
    throw new Error('Failed to calculate current week.');
  }
}



        // Helper function to get today's date range (start and end)
  async function getTodayRange () {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of today
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1); // Start of tomorrow
          return { today, tomorrow };
        };

module.exports = {
  getClinicTimezone,
  calculateCurrentWeek,
  getTodayRange,
};
