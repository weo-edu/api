/**
 * Imports
 */

var BaseInputSchema = require('./base')

/**
 * shortAnswer
 */

var ShortAnswerSchema = BaseInputSchema.discriminator('shortAnswer', {
  caseSensitive: Boolean
})

ShortAnswerSchema.method('isCorrect', function (responses) {
  var caseSensitive = this.caseSensitive
  return this.correctAnswer.some(function (answer) {
    answer = normalize(answer, caseSensitive)
    if(!answer) return false
    return responses.some(function (response) {
      return normalize(response, caseSensitive) === answer
    })
  })
})

function normalize (str, caseSensitive) {
  str = str.trim()
  if (! caseSensitive) str = str.toLowerCase()

  return str.replace(/\s+/g, ' ')
}

/**
 * Exports
 */

module.exports = ShortAnswerSchema
