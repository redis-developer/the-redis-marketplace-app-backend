const escapeQueryString = (queryString) =>
  String(queryString)
    .replace(/[-[\]{}()<>*+%&?'".,:;!@\\^$|#\s]/g, "\\$&")
    .trim();

module.exports = escapeQueryString;
