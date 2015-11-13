var CommentSchema = require('./schema');
var markdown = require('lib/markdown')


CommentSchema.method('verb', function() {
  return 'commented';
});

CommentSchema.pre('validate', function(next) {
  console.log('originalContent')
  this.content = markdown(this.originalContent);
  next();
});

module.exports = {schema: CommentSchema};
