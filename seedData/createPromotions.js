const createPromotions = async (models, treatments, transaction) => {
  const { Promotion } = models;
  const createdPromotions = [];

  const promotionsData = [
    {
      type: 'treatment',
      referenceId: treatments[0].id, // First treatment
      discount: 10,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 2 weeks later
    },
    {
      type: 'treatment',
      referenceId: treatments[1].id, // Second treatment
      discount: 15,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 1 month later
    },
    {
      type: 'treatment',
      referenceId: treatments[2].id, // Third treatment
      discount: 20,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 21)), // 3 weeks later
    },
  ];

  for (const promotion of promotionsData) {
    const createdPromotion = await Promotion.create(promotion, { transaction });
    console.log('✅ Promotion created:', createdPromotion.toJSON());
    createdPromotions.push(createdPromotion);
  }

  return createdPromotions;
};

module.exports = createPromotions;