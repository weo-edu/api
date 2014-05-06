var mongoose = require('mongoose');
var ShareSchema = require('./schema')(mongoose.Schema);
var ShareHelpers = require('./helpers');

ShareSchema.static('findTo', function(to, user, parent) {
  return this.find(ShareHelpers.query(to, user, parent));
});

module.exports = mongoose.model('Share', ShareSchema);

