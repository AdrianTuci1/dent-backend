const MedicController = require('./medicController');
const TreatmentController = require('./treatmentController');
const ComponentController = require('./componentController');
const PatientController = require('./patientController');
const AppointmentController = require('./appointmentController');


// Instantiate controller classes
const endpointMap = {
  '/api/treatments': new TreatmentController(),
  '/api/components': new ComponentController(),
  '/api/medics': new MedicController(),
  '/api/patients': new PatientController(),
  '/api/appointments': new AppointmentController(),
};

exports.syncEdits = async (req, res) => {
  const edits = req.body; // Array of queued edits

  if (!Array.isArray(edits) || edits.length === 0) {
    return res.status(400).json({ error: 'No edits provided for syncing' });
  }

  const results = [];
  const errors = [];

  // Function to process a single edit
  const processEdit = async (edit) => {
    const { endpoint, method, data } = edit;

    if (!endpoint || !method || !data) {
      throw new Error('Invalid edit structure: Missing endpoint, method, or data');
    }

    const controller = endpointMap[endpoint];
    if (!controller) {
      throw new Error(`No controller found for endpoint: ${endpoint}`);
    }

    const methodMap = {
      POST: 'create',
      PUT: 'update',
      DELETE: 'delete',
      PATCH: 'patch',
    };

    const action = methodMap[method];
    if (!action || typeof controller[`${action}Items`] !== 'function') {
      throw new Error(`Unsupported method: ${method} for endpoint: ${endpoint}`);
    }

    try {
      // Dynamically call the controller method and return its result
      const reqMock = { body: Array.isArray(data) ? data : [data], db: req.db };
      const result = await controller[`${action}Items`](reqMock);
      return { status: 'success', result };
    } catch (error) {
      throw new Error(`Error processing edit for ${endpoint}: ${error.message}`);
    }
  };

  // Process all edits
  for (const edit of edits) {
    try {
      const result = await processEdit(edit);
      results.push({ edit, ...result });
    } catch (error) {
      errors.push({ edit, error: error.message });
    }
  }

  // Return a summary of the sync operation
  res.status(200).json({
    message: 'Sync operation completed',
    results,
    errors,
  });
};