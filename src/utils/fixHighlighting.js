const fixHighlighting = (value) =>
  String(value)
    // Fix highlighting on phrases that contain special characters
    .replace(/(<\/b>)(\S{1,})/g, "$2$1");

module.exports = fixHighlighting;
