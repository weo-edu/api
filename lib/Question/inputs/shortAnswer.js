/**
 * Imports
 */

var BaseInputSchema = require('./base')

/**
 * shortAnswer
 */

var ShortAnswerSchema = BaseInputSchema.discriminator('shortAnswer', {})

ShortAnswerSchema.method('isCorrect', function (responses) {
  return this.correctAnswer.some(function (answer) {
    return responses.some(function (response) {
      return response.trim().toLowerCase() === answer.trim().toLowerCase()
    })
  })
})

/**
 * Exports
 */

module.exports = ShortAnswerSchema
