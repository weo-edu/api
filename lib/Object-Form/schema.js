module.exports = require('./Form/schema');
module.exports.Response = require('./FormResponse/schema');
module.exports.Question = require('./FormQuestion/schema');

// Add Item inputs
var _ = require('lodash');
_.extend(exports, exports.Question);