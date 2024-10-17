

const createComponents = async (models, transaction) => {

  const { Component } = models;
  const componentsData = [
    {
      componentName: 'Cleaning Kit',
      unitPrice: 20.0,
      vendor: 'Dental Supplies Inc.',
      quantity: 100,
    },
    {
      componentName: 'Filling Kit',
      unitPrice: 30.0,
      vendor: 'Dental Supplies Inc.',
      quantity: 50,
    },
    {
      componentName: 'Whitening Gel',
      unitPrice: 15.0,
      vendor: 'Smile Supplies',
      quantity: 75,
    },
    {
      componentName: 'Orthodontic Braces',
      unitPrice: 100.0,
      vendor: 'Braces Inc.',
      quantity: 25,
    },
    {
      componentName: 'X-Ray Film',
      unitPrice: 5.0,
      vendor: 'Dental Imaging Co.',
      quantity: 200,
    },
  ];
  

  const createdComponents = [];
  
  for (const component of componentsData) {
    const createdComponent = await Component.create(component, { transaction });
    console.log('Component created:', createdComponent.toJSON());
    createdComponents.push(createdComponent);
  }

  return createdComponents;
};

module.exports = createComponents;
