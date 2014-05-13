/**
 * Item
 *
 * @field content Displayable content of choice.
 * 
 */

module.exports = function(Schema) {

  var ObjectSchema = require('lib/Object/schema')(Schema);

  var ItemSchema = ObjectSchema.discriminator('choice', {
    content: {
      required: true
    }
  });

  return ItemSchema;
}