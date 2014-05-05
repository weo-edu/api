module.exports = function(Schema) {
  var ResponseSchema = new Schema({
    object: {
      type: {
        type: String,
        default: 'response'
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
    },
    verb: {
      type: String,
      default: 'answered'
    }
  }, {id: true, _id: true});

  return ResponseSchema;
};