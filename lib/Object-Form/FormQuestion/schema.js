/**
 * Form Question
 *
 * @field displayName Form question.
 * @field content Form question details.
 * @field answer Text of answer for `text` item and idx of correct choice for `choice` item.
 *
 */

var PostSchema = require('lib/Object-Posts/Post/schema');
var selfLink = require('lib/schema-plugin-selflink');

var FormQuestionSchema = module.exports = PostSchema.discriminator('formQuestion', {
  displayName: {
    type: String
  },
  originalContent: {
    type: String,
    required: true
  },
  poll: {
    type: Boolean,
    default: false
  },
  correctAnswer: String,
  response: String
});

FormQuestionSchema.virtual('responseType').get(function() {
  return this.attachments[0] && this.attachments[0].objectType;
});

FormQuestionSchema.method('isGradeable', function() {
  return this.correctAnswer !== undefined;
});

FormQuestionSchema.method('isCorrect', function() {
  return this.correctAnswer !== undefined && this.response === this.correctAnswer;
});

FormQuestionSchema.path('attachments').validate(function(attachments) {
  return attachments.length > 0;
}, 'You must choose a response type', 'required');

FormQuestionSchema.path('correctAnswer').validate(function(correctAnswer) {
  if(this.poll)
    return true;
  if(this.responseType === 'text')
    return true;
  if(correctAnswer)
    return true;

  return false;
}, 'Please identify the correct answer', 'required');


function extend(to, from) {
  for(var key in from) {
    if(from.hasOwnProperty(key))
      to[key] = from[key];
  }
}

extend(FormQuestionSchema, require('./inputs'));
FormQuestionSchema.plugin(selfLink);