var mongoose = require('mongoose');
var ShareSchema = require('./schema');
var ShareHelpers = require('./helpers');

/**
 * Static methods
 */
ShareSchema.static('findTo', function(to, user, channel) {
  return this.find(ShareHelpers.query(to, user, channel));
});

/**
 * Instance methods
 */
ShareSchema.method('contextualize', function(group) {
  // XXX Implement this
  return this;
});

module.exports = mongoose.model('Share', ShareSchema);
