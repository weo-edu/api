/**
 * Item
 *
 * @field displayName Form question.
 * @field content Form question details.
 * @field answer Text of answer for `text` item and idx of correct choice for `choice` item.
 *
 */

var Schema = require('mongoose').Schema;
var ObjectSchema = require('lib/Object/schema');
var ItemSchema = ObjectSchema.discriminator('item', {
  displayName: {
    required: true
  }
});

function extend(to, from) {
  for(var key in from) {
    if(from.hasOwnProperty(key))
      to[key] = from[key];
  }
}

extend(ItemSchema, require('./inputs'));