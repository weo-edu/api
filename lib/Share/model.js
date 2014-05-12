var mongoose = require('mongoose');
var ShareSchema = require('./schema')(mongoose.Schema);
var ShareHelpers = require('./helpers');

/**
 * Static methods
 */
ShareSchema.static('findTo', function(to, user, parent) {
  return this.find(ShareHelpers.query(to, user, parent));
});

/**
 * Instance methods
 */
ShareSchema.method('contextualize', function(group) {
  // XXX Implement this
  return this;
});

module.exports = mongoose.model('Share', ShareSchema);