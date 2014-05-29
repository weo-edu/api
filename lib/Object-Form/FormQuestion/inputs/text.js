/**
 * Text
 *
 * @field displayName Placeholder text for input box.
 * 
 */

module.exports = function(Schema) {

  var ObjectSchema = require('lib/Object/schema')(Schema);

  var TextSchema = ObjectSchema.discriminator('text', {
    displayName: {
      required: true
    }
  });

  return TextSchema;
}