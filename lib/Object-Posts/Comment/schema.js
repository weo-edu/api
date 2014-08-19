var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
var marked = require('lib/markdown');
var qs = require('querystring');

var CommentSchema = module.exports = ObjectSchema.discriminator('comment', {
  originalContent: {
    type: String,
    required: true
  },
  votes: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.path('votes')});
  }, ['points'])
});

CommentSchema.pre('validate', function(next) {
  this.transformOriginalContent(marked);
  next();
});