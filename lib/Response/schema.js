var validations = require('lib/validations');

module.exports = function(Schema) {
  var ResponseSchema = new Schema({
    user: {
      type: String,
      required: true
    },
    collection: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    correct: {
      type: Boolean
    }
  });

  return ResponseSchema;
};