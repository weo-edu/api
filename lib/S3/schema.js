var validations = require('lib/validations');

module.exports = function(Schema) {
  var S3Schema = new Schema({
    name: {
      type: String,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    base: {
      type: String,
      required: true,
      validate: [validations.url, 'base field must be a url', 'url']
    },
    type: {
      type: String,
      required: true
    },
    ext: {
      type: String,
      required: true
    },
    thumb_ext: String,
    completed: {
      type: Boolean,
      default: false
    },
    credential: {}
  });

  return S3Schema;
};