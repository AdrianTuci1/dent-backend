
const createTreatments = async (models, transaction) => {
  const { Treatment } = models;

  const treatmentsData = [
    // 🔹 Cleaning & Preventive Treatments
    {
      id: 'T001',
      name: 'Teeth Cleaning',
      category: 'Cleaning',
      description: 'Basic teeth cleaning service',
      duration: 30,
      price: 100.0,
      color: '#FF5733',
    },
    {
      id: 'T002',
      name: 'Deep Cleaning (Scaling & Root Planing)',
      category: 'Cleaning',
      description: 'Deep cleaning to remove plaque and tartar below the gumline',
      duration: 60,
      price: 180.0,
      color: '#E67E22',
    },

    // 🔹 Fillings & Restorative Treatments
    {
      id: 'T003',
      name: 'Tooth Filling',
      category: 'Filling',
      description: 'Tooth filling procedure',
      duration: 45,
      price: 150.0,
      color: '#33FF57',
    },
    {
      id: 'T004',
      name: 'Cavity Treatment & Filling',
      category: 'Filling',
      description: 'Removal of cavities and filling with composite material',
      duration: 50,
      price: 200.0,
      color: '#2ECC71',
    },

    // 🔹 Cosmetic Treatments
    {
      id: 'T005',
      name: 'Teeth Whitening',
      category: 'Cosmetic',
      description: 'Professional teeth whitening treatment',
      duration: 60,
      price: 200.0,
      color: '#3357FF',
    },
    {
      id: 'T006',
      name: 'Veneers',
      category: 'Cosmetic',
      description: 'Custom porcelain veneers to improve smile appearance',
      duration: 90,
      price: 900.0,
      color: '#C70039',
    },

    // 🔹 Orthodontics
    {
      id: 'T007',
      name: 'Orthodontic Adjustment',
      category: 'Orthodontics',
      description: 'Adjustment of orthodontic braces',
      duration: 60,
      price: 300.0,
      color: '#FF33A6',
    },
    {
      id: 'T008',
      name: 'Retainer Fitting',
      category: 'Orthodontics',
      description: 'Fitting a new retainer after orthodontic treatment',
      duration: 45,
      price: 250.0,
      color: '#9B59B6',
    },

    // 🔹 Imaging & Diagnostics
    {
      id: 'T009',
      name: 'Dental X-Ray',
      category: 'Imaging',
      description: 'X-Ray imaging for dental examination',
      duration: 15,
      price: 75.0,
      color: '#FFD700',
    },
    {
      id: 'T010',
      name: '3D CT Scan',
      category: 'Imaging',
      description: '3D CT scan for a detailed view of the teeth and jaw',
      duration: 30,
      price: 350.0,
      color: '#F39C12',
    },

    // 🔹 Surgical Treatments
    {
      id: 'T011',
      name: 'Tooth Extraction',
      category: 'Surgical',
      description: 'Removal of a damaged or decayed tooth',
      duration: 60,
      price: 220.0,
      color: '#E74C3C',
    },
    {
      id: 'T012',
      name: 'Wisdom Tooth Extraction',
      category: 'Surgical',
      description: 'Surgical removal of impacted wisdom teeth',
      duration: 90,
      price: 400.0,
      color: '#8E44AD',
    },

    // 🔹 Periodontal & Gum Treatments
    {
      id: 'T013',
      name: 'Gum Disease Treatment',
      category: 'Periodontal',
      description: 'Deep cleaning and medication for gum disease',
      duration: 60,
      price: 250.0,
      color: '#16A085',
    },
    {
      id: 'T014',
      name: 'Gum Grafting',
      category: 'Periodontal',
      description: 'Surgical treatment for gum recession',
      duration: 90,
      price: 700.0,
      color: '#2980B9',
    },

    // 🔹 Prosthodontics (Crowns, Bridges, Dentures)
    {
      id: 'T015',
      name: 'Dental Crown Placement',
      category: 'Prosthodontics',
      description: 'Custom dental crown to restore a tooth’s shape and strength',
      duration: 75,
      price: 800.0,
      color: '#D35400',
    },
    {
      id: 'T016',
      name: 'Dental Bridge Placement',
      category: 'Prosthodontics',
      description: 'Fixed dental bridge to replace missing teeth',
      duration: 120,
      price: 1200.0,
      color: '#7F8C8D',
    },
    {
      id: 'T017',
      name: 'Complete Dentures',
      category: 'Prosthodontics',
      description: 'Full set of dentures for edentulous patients',
      duration: 120,
      price: 1500.0,
      color: '#95A5A6',
    },

    // 🔹 Implantology
    {
      id: 'T018',
      name: 'Dental Implant Placement',
      category: 'Implantology',
      description: 'Surgical placement of a dental implant',
      duration: 120,
      price: 2500.0,
      color: '#34495E',
    },
    {
      id: 'T019',
      name: 'Implant-Supported Dentures',
      category: 'Implantology',
      description: 'Dentures fixed on implants for better stability',
      duration: 150,
      price: 3500.0,
      color: '#1ABC9C',
    },
  ];

  const createdTreatments = [];

  for (const treatment of treatmentsData) {
    const createdTreatment = await Treatment.create(treatment, { transaction });
    console.log('✅ Treatment created:', createdTreatment.toJSON());
    createdTreatments.push(createdTreatment);
  }

  return createdTreatments;
};

module.exports = createTreatments;