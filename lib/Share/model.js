var mongoose = require('mongoose');
var ShareSchema = require('./schema')(mongoose.Schema);
var ShareHelpers = require('./helpers');

ShareSchema.static('findTo', function(to, user, channel) {
  return this.find(ShareHelpers.query(to, user, channel));
});

module.exports = mongoose.model('Share', ShareSchema);

