var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');

var CommentSchema = ObjectSchema.discriminator('comment', {
  originalContent: {
    type: String,
    required: true
  }
});

CommentSchema.method('toKey', function(key) {
  key.content = this.content;
  key.url += '/' + this.share().contexts[0].descriptor.id + '/' + this.share().id;
  return key;
});

CommentSchema.plugin(selfLink);

module.exports = CommentSchema;