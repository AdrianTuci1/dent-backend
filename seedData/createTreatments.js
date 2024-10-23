

const createTreatments = async (models, components, transaction) => {
  const { Treatment } = models;

  const treatmentsData = [
    {
      id: 'T001',
      name: 'Teeth Cleaning',
      category: 'Cleaning',
      description: 'Basic teeth cleaning service',
      duration: 30,
      components: ['Cleaning Kit'],
      componentsUnits: [1],
      price: 100.0,
      color: '#FF5733',
    },
    {
      id: 'T002',
      name: 'Tooth Filling',
      category: 'Filling',
      description: 'Tooth filling procedure',
      duration: 45,
      components: ['Filling Kit'],
      componentsUnits: [1],
      price: 150.0,
      color: '#33FF57',
    },
    {
      id: 'T003',
      name: 'Teeth Whitening',
      category: 'Cosmetic',
      description: 'Professional teeth whitening treatment',
      duration: 60,
      components: ['Whitening Gel'],
      componentsUnits: [1],
      price: 200.0,
      color: '#3357FF',
    },
    {
      id: 'T004',
      name: 'Orthodontic Adjustment',
      category: 'Orthodontics',
      description: 'Adjustment of orthodontic braces',
      duration: 60,
      components: ['Orthodontic Braces'],
      componentsUnits: [1],
      price: 300.0,
      color: '#FF33A6',
    },
    {
      id: 'T005',
      name: 'Dental X-Ray',
      category: 'Imaging',
      description: 'X-Ray imaging for dental examination',
      duration: 15,
      components: ['X-Ray Film'],
      componentsUnits: [2],
      price: 75.0,
      color: '#FFD700',
    },
  ];
  

  const createdTreatments = [];
  
  for (const treatment of treatmentsData) {
    const createdTreatment = await Treatment.create(treatment, { transaction });
    console.log('Treatment created:', createdTreatment.toJSON());
    createdTreatments.push(createdTreatment);
  }

  return createdTreatments;
};

module.exports = createTreatments;
