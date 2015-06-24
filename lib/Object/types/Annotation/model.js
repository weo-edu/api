var CommentSchema = require('./schema');

CommentSchema.method('verb', function() {
  return 'commented';
});

CommentSchema.pre('validate', function(next) {
  this.content = this.originalContent;
  next();
});

module.exports = {schema: CommentSchema};