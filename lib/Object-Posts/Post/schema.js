var ObjectSchema = require('lib/Object/schema');
var marked = require('lib/markdown');

function contentOrAttachments(originalContent) {
  return originalContent || this.content;
}

var PostSchema = module.exports = ObjectSchema.discriminator('post', {
  originalContent: {
    validate: [contentOrAttachments, 'Required if no media', 'required']
  }
});

PostSchema.pre('validate', function(next) {
  this.transformOriginalContent(marked);
  next();
});