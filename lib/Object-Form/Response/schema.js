module.exports = function(Schema) {
  var ObjectSchema = require('lib/Object/schema')(Schema);

  var ResponseSchema = ObjectSchema.discriminator('response', {
    // response
    content: {
      required: true
    },

    // question responded to
    questionId: {
      type: Schema.Types.ObjectId
    },
    // copy of question content
    questionContent: {
      type: String,
      required: true
    },
    // was response correct
    correct: {
      type: Boolean
    }
  });

  return ResponseSchema;
};