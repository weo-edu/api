module.exports = function(Schema) {
  var ObjectSchema = require('lib/Object/schema')(Schema);

  function contentOrAttachments(content) {
    if (!content && !(this.attachments && this.attachments.length))
      return false;
    else
      return true;
  }

  var PostSchema = ObjectSchema.discriminator('post', {
    content: {
      validate: [contentOrAttachments, 'Required if no media', 'required']
    }
  });

  return PostSchema;
}