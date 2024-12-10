// utils/getSubdomainFromDb.js

function getSubdomainFromDb(dbString) {
    if (!dbString) {
      throw new Error('Invalid database string format');
    }
    return dbString.split('_db')[0];
  }
  
  module.exports =  getSubdomainFromDb ;
  