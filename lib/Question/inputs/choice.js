/**
 * Imports
 */

var BaseInputSchema = require('./base')

/**
 * Choice
 */

var ChoiceSchema = BaseInputSchema.discriminator('choice', {
  originalContent: {
    type: String
  },
  content: String
})

ChoiceSchema.method('isCorrect', function (response) {
  var contains = response.indexOf(this._id.toString()) !== -1
  return this.correctAnswer.length
    ? contains
    : !contains
})

/**
 * Exports
 */

module.exports = ChoiceSchema
