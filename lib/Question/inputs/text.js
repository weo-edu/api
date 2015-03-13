/**
 * Text
 *
 * @field displayName Placeholder text for input box.
 *
 */
var BaseInputSchema = require('./base');
module.exports = BaseInputSchema.discriminator('text', {
  enableMedia: {
    type: Boolean,
    default: false
  }
});