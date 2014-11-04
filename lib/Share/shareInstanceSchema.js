var Schema = require('mongoose').Schema;
var selfLink = require('lib/schema-plugin-selflink');

/**
 * shareInstance discriminator
 */
var ShareInstance = new Schema({
  status: {
    type: String,
    enum: ['active', 'pending', 'draft', 'returned'],
    required: true
  },
  comments: selfLink.embed(function() {
    return '/share/' + this.id + '/comments';
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