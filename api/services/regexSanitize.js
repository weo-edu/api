/**
 * regexSanitize takes a string as input and escapes
 * any regex special characters.
 * @param  {[type]} str [unescaped input string]
 * @return {[type]}     [escaped string]
 */
module.exports = function(str) {
  return str.replace(/[-[\]{}()+?*.\/,\\^$|#]/g, "\\$&");
};