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
    answer = normalize(answer)
    return responses.some(function (response) {
      return normalize(response) === answer
    })
  })
})

function normalize (str) {
  return str.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Exports
 */

module.exports = ShortAnswerSchema
