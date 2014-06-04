/**
 * Form Question
 *
 * @field displayName Form question.
 * @field content Form question details.
 * @field answer Text of answer for `text` item and idx of correct choice for `choice` item.
 *
 */

var Schema = require('mongoose').Schema;
var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');

var FormQuestionSchema = module.exports = ObjectSchema.discriminator('formQuestion', {
  displayName: {
    required: true
  },
  progress: selfLink.embed('progress','correct')
});


FormQuestionSchema.virtual('responseType', function() {
  return this.attachments[0].objectType;
});

FormQuestionSchema.method('responseToContent', function(originalContent) {
  var choice = parseInt(originalContent);
  if (isNaN(choice) && this.responseType !== 'choice')
    return originalContent;
  else {
    return this.attachments[choice].content;
  }
});

FormQuestionSchema.method('addChoice', function() {
  this.attachments.push({objectType: 'choice'});
});

FormQuestionSchema.method('isLeaf', function() {
  return true;
})

function extend(to, from) {
  for(var key in from) {
    if(from.hasOwnProperty(key))
      to[key] = from[key];
  }
}

extend(FormQuestionSchema, require('./inputs'));