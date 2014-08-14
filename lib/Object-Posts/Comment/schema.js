var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');

var CommentSchema = module.exports = ObjectSchema.discriminator('comment', {
  originalContent: {
    type: String,
    required: true
  },
  votes: selfLink.embed('points'),
  checks: selfLink.embed('points')
});

CommentSchema.method('toKey', function(key) {
  key.content = this.content;
  key.url += '/' + this.share().contexts[0].descriptor.id + '/' + this.share().id;
  return key;
});
