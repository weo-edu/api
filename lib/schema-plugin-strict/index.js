/*
  Mongoose plugin that adds a createdAt field to every object
 */
module.exports = function() {};

var Schema = require('mongoose').Schema;

var defaults = Schema.prototype.defaultOptions;

Schema.prototype.defaultOptions = function(options) {
  options = defaults(options);
  options.strict = 'throw';
  return options;
};