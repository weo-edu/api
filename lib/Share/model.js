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

ShareSchema.method('setId', function() {
  if (!this._id) {
    this._id = new mongoose.Schema.Types.ObjectId;
  }
});

ShareSchema.pre('validate', function(next) {
  if(! this.students.selfLink)
    this.students.selfLink = '/share/' + this.id + '/students';
  next();
});

module.exports = mongoose.model('Share', ShareSchema);
