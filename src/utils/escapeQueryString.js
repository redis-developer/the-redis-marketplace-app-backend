const escapeQueryString = (queryString) =>
  String(queryString)
    .replace(/[-[\]{}()<>*+%&?'".,:;!@\\^$|#]/g, "\\$&")
    .trim();

module.exports = escapeQueryString;
