var ObjectSchema = require('lib/Object/schema');


//XXX should use parent instead of question?
var ResponseSchema = module.exports = ObjectSchema.discriminator('formResponse', {
  // response
  // XXX require?
  content: {
    type: String
  },
  question: {
    id: String,
    displayName: String,
  },
  correct: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 1
  },
  displayType: {
    type: String
  }
});


ResponseSchema.method('answer', function(question, originalContent) {
  this.question = {};
  this.question.id = question.id;
  this.question.displayName = question.displayName;
  this.correct = + question.isCorrect(originalContent);
  this.content = question.responseToContent(originalContent);
  this.originalContent = originalContent;
  this.displayType = question.parent().objectType + ' question';
});