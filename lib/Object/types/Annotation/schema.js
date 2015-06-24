var ObjectSchema = require('lib/Object/schema');
var Schema = require('mongoose').Schema;

var AnnotationLocation = new Schema({
  path: {
    type: String,
    required: true
  },
  quote: String,
  startOffset: String,
  endOffset: String
});

module.exports = ObjectSchema.discriminator('annotation', {
  originalContent: {
    type: String,
    required: true
  },
  location: AnnotationLocation.embed()
});