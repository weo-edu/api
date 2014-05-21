exports.Poll = require('./Poll/schema');
exports.FormResponse = require('./FormResponse/schema');
exports.FormQuestion = require('./FormQuestion/schema');

// Add Item inputs
var _ = require('lodash');
_.extend(exports, exports.FormQuestion);