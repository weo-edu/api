var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');

function contentOrAttachments(originalContent) {
  return originalContent || this.content;
}

module.exports = ObjectSchema.discriminator('post', {
  originalContent: {
    validate: [contentOrAttachments, 'Required if no media', 'required']
  },
  replies: selfLink.embed()
});
