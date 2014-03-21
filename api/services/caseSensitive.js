/**
 * caseSensitive takes a string and returns a case-sensitive regex
 * We need this because waterline forces all lookups to ignore case,
 * but we sometimes want to do case-sensitive lookups
 * @param  {[string]} str [input string]
 * @return {[RegExp]}     [case-sensitive regex that matches str]
 */
module.exports = function(str) {
  return new RegExp('^' + regexSanitize(str) + '$');
};