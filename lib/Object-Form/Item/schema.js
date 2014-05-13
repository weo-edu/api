var _ = require('lodash');

/**
 * Item
 *
 * @field displayName Form question.
 * @field content Form question details.
 * @field answer Text of answer for `text` item and idx of correct choice for `choice` item.
 * 
 */

var Item = module.exports = function(Schema) {

  var ObjectSchema = require('lib/Object/schema')(Schema);

  var ItemSchema = ObjectSchema.discriminator('item', {
    displayName: {
      required: true
    }
  });

  return ItemSchema;
};

_.extend(Item, require('./inputs'));