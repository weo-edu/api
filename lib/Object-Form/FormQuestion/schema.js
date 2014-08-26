/**
 * Form Question
 *
 * @field displayName Form question.
 * @field content Form question details.
 * @field answer Text of answer for `text` item and idx of correct choice for `choice` item.
 *
 */

var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
var qs = require('querystring');

var FormQuestionSchema = module.exports = ObjectSchema.discriminator('formQuestion', {
  displayName: {
    required: true
  },
  progress: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.path('progress')});
  }, ['progress', 'correct'])
});

FormQuestionSchema.virtual('responseType').get(function() {
  return this.attachments[0] && this.attachments[0].objectType;
});

FormQuestionSchema.method('responseToContent', function(originalContent) {
  switch(this.responseType) {
  case 'choice':
    return this.find(originalContent).displayName;
  default:
    return originalContent;
  }
});

function extend(to, from) {
  for(var key in from) {
    if(from.hasOwnProperty(key))
      to[key] = from[key];
  }
}

extend(FormQuestionSchema, require('./inputs'));
FormQuestionSchema.plugin(selfLink);