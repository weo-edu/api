var mongoose = require('mongoose');
var ShareSchema = require('./schema');
var ShareHelpers = require('./helpers');

/**
 * Static methods
 */
var util = require('util');
ShareSchema.static('findTo', function(to, user, channel, text) {
  return this.find(ShareHelpers.query(to, user, channel, text));
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

ShareSchema.index({
  'title': 'text',
  'verb': 'text',
  'actor.displayName': 'text', 
  '_object.content': 'text',
  '_object.displayName': 'text',
  '_object.attachments.content': 'text',
  '_object.attachments.displayName': 'text',
  '_object.attachments.objectType': 'text',
  '_object.attachments.attachments.content': 'text',
  '_object.attachments.attachments.displayName': 'text',
  '_object.attachments.attachments.attachments.content': 'text',
  '_object.attachments.attachments.attachments.displayName': 'text'
}, {
  name: 'ShareTextIndex'
});

ShareSchema.index({
  channel: 1,
  'to.board': 1
});



module.exports = mongoose.model('Share', ShareSchema);
