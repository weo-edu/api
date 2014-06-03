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

var Share = module.exports = mongoose.model('Share', ShareSchema);