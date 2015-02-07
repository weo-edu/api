var ObjectSchema = require('lib/Object/schema');
var PointSchema = require('lib/Point');

var SectionSchema = ObjectSchema.discriminator('section', {
  points: PointSchema.embed()
});

SectionSchema.method('isGraded', function() {
  return this.attachments.every(function(obj) {
    return obj.isGraded();
  });
});

module.exports = SectionSchema;