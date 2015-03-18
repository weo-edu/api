/**
 * Form Question
 *
 * @field displayName Form question.
 * @field content Form question details.
 * @field answer Text of answer for `text` item and idx of correct choice for `choice` item.
 *
 */

var ObjectSchema = require('lib/Object/schema');
var PostSchema = require('lib/Object/types/Post/schema');
var ResponseSchema = require('./inputs').Response;
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
  points: PointSchema.embed()
});

QuestionSchema.plugin(require('lib/schema-plugin-nested'));
QuestionSchema.nested('response', ResponseSchema, {
  default: [{
    objectType: 'response',
    attachments: [
      {objectType: 'text'}
    ]
  }]
});

QuestionSchema.virtual('responseType').get(function() {
  return this.attachments && this.attachments[0] && this.attachments[0].objectType;
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

QuestionSchema.method('isGraded', function() {
  var scaled = this.points.scaled;
  return scaled !== null && scaled !== undefined;
});

QuestionSchema.method('isCorrect', function() {
  if(! this.isAutoGradable())
    return false;

  return this.correctAnswer
    .indexOf(this.response.value.trim()) !== -1;
});

QuestionSchema.method('instanceData', function() {
  return {
    id: this._id,
    scaled: this.points.scaled,
    response: this.response
  };
});

QuestionSchema.method('applyInstanceData', function(data) {
  this.points.scaled = data.scaled;
  this.response = data.response;
});

QuestionSchema.path('attachments').validate(function() {
  return this.attachments.length > 0;
}, 'You must choose a response type', 'required');

QuestionSchema.path('correctAnswer').get(function() {
  return this.attachments && this.attachments.reduce(function(memo, child) {
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