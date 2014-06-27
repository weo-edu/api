var CommentSchema = require('./schema');

CommentSchema.method('verb', function() {
  return 'commented';
});

module.exports = {schema: CommentSchema};