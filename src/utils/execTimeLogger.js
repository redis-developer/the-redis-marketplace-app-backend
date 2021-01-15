const execTimeLogger = async (execFunction) => {
  if (typeof execFunction !== "function") {
    throw new Error("execFunction must be a function parameter");
  }

  const startTime = new Date();
  const functionResponse = await execFunction();
  const executeTime = (new Date() - startTime) / 1000;

  return { executeTime, functionResponse };
};

module.exports = execTimeLogger;
