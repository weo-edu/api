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
var FormQuestionSchema = module.exports = ObjectSchema.discriminator('formQuestion', {
  displayName: {
    required: true
  },
  progress: {
    selfLink: {
      type: String,
      required: true
    },
    total: [ObjectSchema.selfLinkTotal.extend({
      progress: {
        type: Number,
        default: 0
      },
      correct: {
        type: Number,
        default: 0
      }
    })]
  }
});

FormQuestionSchema.method('addChoice', function() {
  this.attachments.push({objectType: 'choice'});
});

function extend(to, from) {
  for(var key in from) {
    if(from.hasOwnProperty(key))
      to[key] = from[key];
  }
}

extend(FormQuestionSchema, require('./inputs'));