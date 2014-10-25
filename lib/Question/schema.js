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
var PointSchema = require('lib/Point');


var QuestionSchema = module.exports = PostSchema.discriminator('question', {
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
  correctAnswer: [String],
  points: PointSchema.embed(),
  response: String
});

QuestionSchema.virtual('responseType').get(function() {
  return this.attachments[0] && this.attachments[0].objectType;
});

QuestionSchema.method('isGradable', function() {
  return ! this.poll;
});

QuestionSchema.method('isAutoGradable', function() {
  return !! this.correctAnswer.length;
});

QuestionSchema.method('hasCorrectAnswer', function() {
  return (! (this.poll || this.responseType === 'text') && !! this.responseType);
});

QuestionSchema.method('isCorrect', function() {
  if(! this.isAutoGradable())
    return false;

  var response = this.response && this.response.trim();
  return this.correctAnswer.some(function(answer) {
    return answer.trim() === response;
  });
});

QuestionSchema.path('attachments').validate(function(attachments) {
  return attachments.length > 0;
}, 'You must choose a response type', 'required');

QuestionSchema.path('correctAnswer').get(function() {
  return this.attachments.reduce(function(memo, child) {
    return memo.concat(child.correctAnswer);
  }, []);
});

QuestionSchema.path('correctAnswer').validate(function() {
  if(this.hasCorrectAnswer())
    return !! this.correctAnswer.length;

  return true;
}, 'Please identify the correct answer', 'correct');



function extend(to, from) {
  for(var key in from) {
    if(from.hasOwnProperty(key))
      to[key] = from[key];
  }
}

extend(QuestionSchema, require('./inputs'));
QuestionSchema.plugin(selfLink);