var ObjectSchema = require('lib/Object/schema');
var PointSchema = require('lib/Point');

var SectionSchema = ObjectSchema.discriminator('section', {
  points: PointSchema.embed()
});



SectionSchema.path('attachments').validate(function(attachments) {
  return this.share().isQueued() || attachments && attachments.length > 0;
}, 'Section must have at least 1 attachment', 'minLength');

module.exports = SectionSchema;