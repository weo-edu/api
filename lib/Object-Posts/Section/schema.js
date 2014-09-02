var ObjectSchema = require('lib/Object/schema');
var SectionSchema = ObjectSchema.discriminator('section', {});

SectionSchema.path('attachments').validate(function(attachments) {
  return this.share().isDraft() || attachments && attachments.length > 0;
}, 'Section must have at least 1 attachment', 'minLength');

module.exports = SectionSchema;