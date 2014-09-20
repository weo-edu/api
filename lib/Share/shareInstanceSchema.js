var Schema = require('mongoose').Schema;
var selfLink = require('lib/schema-plugin-selflink');

/**
 * shareInstance discriminator
 */
var ShareInstance = new Schema({
  comments: selfLink.embed(function() {
    return '/share/' + this.id + '/comments';
  })
}, {discriminatorKey: 'shareType'});

ShareInstance.method('score', function() {
  return this.object.score();
});

ShareInstance.method('isUnopened', function() {
  return this.isDraft();
});

ShareInstance.method('isStarted', function() {
  return this.isQueued();
});

ShareInstance.method('isComplete', function() {
  return this.isPublished();
});

ShareInstance.plugin(selfLink);
module.exports = ShareInstance;