var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var selfLink = require('lib/schema-plugin-selflink');
var qs = require('querystring');
var status = require('./status');

/**
 * shareInstance discriminator
 */
var ShareInstance = new Schema({
  status: {
    type: Number,
    enum: Object.keys(status).map(function(k) { return status[k]; }),
    default: status.Unopened,
    required: true
  },
  annotations: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('annotations')});
  })
}, {discriminatorKey: 'shareType'});

Object.keys(status).forEach(function(name) {
  var val = status[name];

  // E.g. isTurnedIn
  ShareInstance.method('is' + name, function() {
    return this.status === val;
  });

  // E.g. hasTurnedIn
  ShareInstance.method('has' + name, function() {
    return this.status >= val;
  });

  // E.g. setTurnedIn
  ShareInstance.method('set' + name, function() {
    this.status = val;
  });
});

ShareInstance.method('annotate', function(path, options) {
  options = options || {};
  var comment = this.createChild('annotation', {
    channels: this.getChannel('annotations')
  });
  comment.shareType = 'annotation';

  options.path = path;
  comment.object.location = options;
  return comment;
});

ShareInstance.method('instanceData', function() {
  return this.object.instanceData();
});

ShareInstance.method('applyInstanceData', function(data) {
  var self = this;
  data.forEach(function(item) {
    var object = self.object.find(item.id);
    object && object.applyInstanceData(item);
  });
});

ShareInstance.plugin(selfLink);
module.exports = ShareInstance;