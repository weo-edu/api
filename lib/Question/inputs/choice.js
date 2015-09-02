/**
 * Choice
 *
 * @field content Displayable content of choice.
 *
 */
var BaseInputSchema = require('./base')

module.exports = BaseInputSchema.discriminator('choice', {
  originalContent: {
    type: String,
    required: true
  },
  content: String
})