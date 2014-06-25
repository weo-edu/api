var PostSchema = require('./schema');

PostSchema.method('verb', function() {
  return 'shared';
});

PostSchema.pre('validate', function(next) {
  this.setSelfLink('replies');
  next();
});

module.exports = {schema: PostSchema};