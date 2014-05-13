var mongoose = require('mongoose');
var CommentSchema = require('./schema')(mongoose.Schema);

CommentSchema.method('verb', function() {
  return 'commented';
});

module.exports = {schema: CommentSchema};