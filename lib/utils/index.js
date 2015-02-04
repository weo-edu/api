var utils = exports;

exports.capitalize = function(str) {
  return str[0].toUpperCase() + str.slice(1);
};

exports.uncapitalize = function(str) {
  return str[0].toLowerCase() + str.slice(1);
};

exports.capitalizeWords = function(str) {
  return str
    .split(' ')
    .filter(Boolean)
    .map(utils.capitalize)
    .join(' ');
};

exports.uncapitalizeWords = function(str) {
  return str
    .split(' ')
    .filter(Boolean)
    .map(utils.uncapitalize)
    .join(' ');
};

