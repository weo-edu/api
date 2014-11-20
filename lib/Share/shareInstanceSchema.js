var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var selfLink = require('lib/schema-plugin-selflink');
var _ = require('lodash');
var qs = require('querystring');

/**
 * shareInstance discriminator
 */
var ShareInstance = new Schema({
  status: {
    type: String,
    enum: ['active', 'pending', 'draft', 'returned'],
    required: true
  },
  annotations: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('annotations')});
  })
}, {discriminatorKey: 'shareType'});

ShareInstance.method('isUnopened', function() {
  return this.isDraft();
});

ShareInstance.method('isStarted', function() {
  return this.isQueued();
});

ShareInstance.method('isComplete', function() {
  return this.isPublished();
});

ShareInstance.method('isReturned', function() {
  return this.status === 'returned';
});

ShareInstance.method('awaitingReturn', function() {
  return this.status === 'active';
});

ShareInstance.method('annotate', function(path, options) {
  options = options || {};
  var comment = this.createChild('annotation', {channels: this.getChannel('annotations')});
  comment.object.location.path = path;
  _.extend(comment.object.location.path, options);
  console.log('comment', comment);
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