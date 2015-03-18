/**
 * choiceResponse
 *
 * @field content Displayable content of choice.
 *
 */
var ObjectSchema = require('lib/Object/schema');
module.exports = ObjectSchema.discriminator('response', {
  value: String
});