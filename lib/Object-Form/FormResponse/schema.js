var Schema = require('mongoose').Schema;
var ObjectSchema = require('lib/Object/schema');
var ResponseSchema = module.exports = ObjectSchema.discriminator('formResponse', {
  // response
  content: {
    required: true
  },

  question: {
    id: String,
    content: {
      type: String
    }
  },

  correct: {
    type: Number
  },

  progress: {
    type: Number
  },

});

ResponseSchema.method('answer', function(question, content) {
  this.question.id = question._id;
  this.question.content = question.content;
  this.content = content;
});