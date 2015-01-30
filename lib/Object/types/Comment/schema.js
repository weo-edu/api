var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
var qs = require('querystring');

var CommentSchema = module.exports = ObjectSchema.discriminator('comment', {
  originalContent: {
    type: String,
    required: true
  },
  votes: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('votes')});
  }, ['points'])
});

CommentSchema.method('toKey', function(key) {
  key.content = this.content;
  key.url += '/' + this.share().contexts[0].descriptor.id + '/' + this.share().id;
  return key;
});

CommentSchema.plugin(selfLink);