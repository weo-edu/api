exports.Poll = require('./Poll/schema');
exports.Response = require('./Response/schema');
exports.Item = require('./Item/schema');

// Add Item inputs
var _ = require('lodash');
_.extend(exports, exports.Item);