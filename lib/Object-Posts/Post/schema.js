var ObjectSchema = require('lib/Object/schema');

function contentOrAttachments(originalContent) {
  return !! originalContent
    || (this.content || (this.attachments && this.attachments.length));
}

var PostSchema = module.exports = ObjectSchema.discriminator('post', {
  originalContent: {
    validate: [contentOrAttachments, 'Required if no media', 'required']
  }
});
