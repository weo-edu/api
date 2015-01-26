var ObjectSchema = require('lib/Object/schema');
var PointSchema = require('lib/Point');

var SectionSchema = ObjectSchema.discriminator('section', {
  points: PointSchema.embed()
});

module.exports = SectionSchema;