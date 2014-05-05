var mongoose = require('mongoose');
var moment = require('moment');
var ShareSchema = require('./schema')(mongoose.Schema);
var date = require('lib/date');
var ShareHelpers = require('./helpers');

ShareSchema.pre('validate', function(next) {
  var self = this;
  function setPublished() {
    if(self.status === 'active') {
      self.published_at = moment().toISOString();
    } else if(self.status === 'pending') {
      self.published_at = date.max();
    }
  }

  if(this.isModified('status')) {
    setPublished();
  } else if(this.isNew)
    setPublished();

  next();
});

ShareSchema.static('findTo', function(to, user, parent) {
  return this.find(ShareHelpers.query(to, user, parent));
});

ShareSchema.pre('save', function(next) {
  var self = this;
  if (self.isModified('status') || self.isModified('to')) {
    _.each(self.to, function(address) {
      address.deny = self.status === 'pending' 
        ? 'student' 
        : undefined; 
    });
  }
  next();
});

module.exports = mongoose.model('Share', ShareSchema);

