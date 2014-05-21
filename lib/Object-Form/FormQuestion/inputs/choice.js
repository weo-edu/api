/**
 * Choice
 *
 * @field content Displayable content of choice.
 *
 */


var ObjectSchema = require('lib/Object/schema');

var ChoiceSchema = module.exports = ObjectSchema.discriminator('choice', {
  originalContent: {
    required: true
  }
});