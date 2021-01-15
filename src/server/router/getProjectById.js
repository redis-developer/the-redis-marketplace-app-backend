const { getProject } = require("../models/project");
const { joiSchemas, validateInput } = require("../../validation");

const { joiStringRequired, joiObjectRequired } = joiSchemas;

const getProjectByIdHandler = async (req, res, next) => {
  try {
    const paramSchema = joiObjectRequired({
      id: joiStringRequired,
    });

    const { id } = await validateInput(req.params, paramSchema);

    const project = await getProject(id);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

module.exports = getProjectByIdHandler;
