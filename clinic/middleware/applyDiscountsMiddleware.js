const { Op } = require('sequelize');

const applyDiscounts = async (req, res, next) => {
  try {
    const db = req.db

    const promotions = await db.Promotion.findAll({
      where: {
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });

    res.locals.treatments = res.locals.treatments.map(treatment => {
      let discount = 0;

      const treatmentPromo = promotions.find(promo => promo.type === 'treatment' && promo.name === treatment.name);
      if (treatmentPromo) {
        discount = treatmentPromo.discount;
      }

      const categoryPromo = promotions.find(promo => promo.type === 'category' && promo.name === treatment.category);
      if (categoryPromo && categoryPromo.discount > discount) {
        discount = categoryPromo.discount;
      }

      const discountedPrice = treatment.price * (1 - discount / 100);

      return {
        ...treatment,
        originalPrice: treatment.price,
        discountedPrice: parseFloat(discountedPrice.toFixed(2)),
        discountPercentage: discount
      };
    });

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = applyDiscounts;