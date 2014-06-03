var mongoose = require('mongoose');
var ShareSchema = require('./schema');

/**
 * Static methods
 */
ShareSchema.static('findTo', function(to, user, channel) {
  var query = this.find().or(to.map(user.addressQuery.bind(user)));
  if(channel !== '*')
    query.where('channel', channel || null);
  return query;
});

ShareSchema.static('parseChannel', function(channel) {
  var channelS = channel.split('.');
  return {
    channel: channel,
    share: channelS[0],
    leaf: channelS[channelS.length - 2],
    property: channelS[channelS.length - 1]
  };
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

ShareSchema.method('parseChannel', function() {
  return Share.parseChannel(this.channel);
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
  '_object.tags': 'text',
  '_object.attachments.content': 'text',
  '_object.attachments.displayName': 'text',
  '_object.attachments.objectType': 'text',
  '_object.attachments.attachments.content': 'text',
  '_object.attachments.attachments.displayName': 'text',
  '_object.attachments.attachments.attachments.content': 'text',
  '_object.attachments.attachments.attachments.displayName': 'text'
}, {
  name: 'ShareTextIndex',
  weights: {
    '_object.tags': 10
  }
});

ShareSchema.index({
  channel: 1,
  'to.board': 1
});

var Share = module.exports = mongoose.model('Share', ShareSchema);