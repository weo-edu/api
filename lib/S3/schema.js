var validations = require('lib/validations');
var Schema = require('mongoose').Schema;

module.exports = new Schema({
  name: {
    type: String,
    required: true
  },
  user: {
    type: 'ObjectId',
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