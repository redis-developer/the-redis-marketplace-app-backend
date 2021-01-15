const { getProjectFilters } = require("../models/project");

const getFiltersHandler = async (req, res, next) => {
  try {
    const filters = await getProjectFilters();
    res.json(filters);
  } catch (err) {
    next(err);
  }
};

module.exports = getFiltersHandler;
