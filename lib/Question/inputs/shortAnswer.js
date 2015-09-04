/**
 * Imports
 */

var BaseInputSchema = require('./base')

/**
 * shortAnswer
 */

var ShortAnswerSchema = BaseInputSchema.discriminator('shortAnswer', {})

ShortAnswerSchema.method('isCorrect', function (response) {
  return this.correctAnswer.some(function (answer) {
    return answer.trim() === response
  })
})

/**
 * Exports
 */

module.exports = ShortAnswerSchema