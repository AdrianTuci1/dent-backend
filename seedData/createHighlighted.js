const createHighlighted = async (models, treatments, transaction) => {
  const { Highlighted } = models;
  const createdHighlighted = [];

  const highlightedData = [
    { type: 'treatment', referenceId: treatments[0].id, name: treatments[0].name },
    { type: 'treatment', referenceId: treatments[1].id, name: treatments[1].name },
    { type: 'treatment', referenceId: treatments[2].id, name: treatments[2].name },
    { type: 'treatment', referenceId: treatments[3].id, name: treatments[3].name },
  ];

  for (const highlight of highlightedData) {
    const createdHighlight = await Highlighted.create(highlight, { transaction });
    console.log('✅ Highlighted treatment created:', createdHighlight.toJSON());
    createdHighlighted.push(createdHighlight);
  }

  return createdHighlighted;
};

module.exports = createHighlighted;