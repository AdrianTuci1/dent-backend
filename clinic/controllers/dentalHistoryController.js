
exports.bulkPatchDentalHistory = async (req, res) => {
    const db = req.db;
    const { patientId, teethUpdates } = req.body; // `teethUpdates` is an array of partial updates
  
    try {
      if (!Array.isArray(teethUpdates) || teethUpdates.length === 0) {
        return res.status(400).json({ error: 'teethUpdates must be a non-empty array' });
      }
  
      const updatePromises = teethUpdates.map(async (tooth) => {
        const { toothNumber, condition, history } = tooth;
  
        const dentalHistory = await db.DentalHistory.findOne({
          where: { patientId, toothNumber },
        });
  
        if (dentalHistory) {
          // Update only the provided fields
          if (condition) dentalHistory.condition = condition;
          if (history) {
            const existingHistory = dentalHistory.history || [];
            const newHistory = [...existingHistory, ...history];
          
            // Deduplicate by ensuring each entry is unique (e.g., based on description)
            dentalHistory.history = newHistory.reduce((acc, item) => {
              if (!acc.some((existing) => existing.description === item.description)) {
                acc.push(item);
              }
              return acc;
            }, []);
          }          
          await dentalHistory.save();
          return dentalHistory;
        } else {
          // Create a new record if it doesn't exist
          return db.DentalHistory.create({
            patientId,
            toothNumber,
            condition: condition || 'sound',
            history: history || [],
          });
        }
      });
  
      const updatedTeeth = await Promise.all(updatePromises);
  
      res.status(200).json(updatedTeeth);
    } catch (error) {
      console.error('Error during bulk patch:', error);
      res.status(500).json({ error: 'Failed to process bulk patch' });
    }
  };
  


  exports.getDentalHistory = async (req, res) => {
    const db = req.db;
  
    if (!db || !db.DentalHistory) {
      console.error("Database or DentalHistory model is undefined");
      console.log("Available models:", db ? Object.keys(db) : "No database object");
      return res.status(500).json({ error: "Database not initialized or DentalHistory model missing" });
    }
  
    const { patientId } = req.params;
  
    try {
      const dentalHistory = await db.DentalHistory.findAll({
        where: { patientId },
        order: [["toothNumber", "ASC"]],
      });
  
      res.status(200).json(dentalHistory);
    } catch (error) {
      console.error("Error fetching dental history:", error);
      res.status(500).json({ error: "Failed to fetch dental history" });
    }
  };
  