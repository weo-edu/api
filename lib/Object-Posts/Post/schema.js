var ObjectSchema = require('lib/Object/schema');

function contentOrAttachments(originalContent) {
  if (originalContent || this.content || (this.attachments && this.attachments.length))
    return true;
  else
    return false;
}

var PostSchema = module.exports = ObjectSchema.discriminator('post', {
  originalContent: {
    validate: [contentOrAttachments, 'Required if no media', 'required']
  },
  replies: {
    selfLink: String,
    total: [{
      items: Number,
      board: String
    }]
  },
  tags: [String]
});