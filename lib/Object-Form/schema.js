exports.Poll = require('./Poll/schema');
exports.Response = require('./FormResponse/schema');
exports.Question = require('./FormQuestion/schema');

// Add Item inputs
var _ = require('lodash');
_.extend(exports, exports.Question);