var validations = require('lib/validations');
var Schema = require('mongoose').Schema;
var UserSchema = require('lib/User/schema');

var S3Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  actor: UserSchema.foreignKey.embed(),
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

module.exports = S3Schema;