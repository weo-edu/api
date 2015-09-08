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
    return response.indexOf(answer.trim()) !== -1
  })
})

/**
 * Exports
 */

module.exports = ShortAnswerSchema