// mongoose plugin to make the default behavior to include
// virtual properties in toJSON
var _ = require('lodash');
module.exports = function(Schema, options) {
  var opts = Schema.get('toJSON');
  Schema.set('toJSON', _.extend({
    virtuals: true,
    id: true,
    minimize: false
  }, opts));
};