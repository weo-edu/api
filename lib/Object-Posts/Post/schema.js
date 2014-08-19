var ObjectSchema = require('lib/Object/schema');
var marked = require('lib/markdown');

var PostSchema = module.exports = ObjectSchema.discriminator('post', {
  originalContent: {
    type: String,
    required: true
  }
});

PostSchema.pre('validate', function(next) {
  this.transformOriginalContent(marked);
  next();
});