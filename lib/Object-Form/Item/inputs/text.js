/**
 * Item
 *
 * @field displayName Placeholder text for input box.
 * 
 */

module.exports = function(Schema) {

  var ObjectSchema = require('lib/Object/schema')(Schema);

  var ItemSchema = ObjectSchema.discriminator('text', {
    displayName: {
      required: true
    }
  });

  return ItemSchema;
}