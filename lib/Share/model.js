var mongoose = require('mongoose');
var moment = require('moment');
var ShareSchema = require('./schema')(mongoose.Schema);
var date = require('lib/date');

ShareSchema.pre('validate', function(next) {
  if(this.isModified('status')) {
    if(this.status === 'active') {
      this.published_at = moment().toISOString();
      this.visibility = undefined;
    } else if(this.status === 'pending') {
      this.visibility = 'teacher';
      this.published_at = date.max();
    }
  } else if(this.isNew)
    this.published_at = moment().toISOString();

  next();
});

ShareSchema.static('receivedBy', function(to, role) {
  return this.find({
    to: to,
    $or: [{visibility: undefined}, {visibility: role}]
  });
});

module.exports = mongoose.model('Share', ShareSchema);
