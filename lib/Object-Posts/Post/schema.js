var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');

function contentOrAttachments(originalContent) {
  if (originalContent || this.content || (this.attachments && this.attachments.length))
    return true;
  else
    return false;
}

module.exports = ObjectSchema.discriminator('post', {
  originalContent: {
    validate: [contentOrAttachments, 'Required if no media', 'required']
  },
  replies: selfLink.embed(),
  votes: selfLink.embed('points')
});
