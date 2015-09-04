/**
 * Imports
 */

var ObjectSchema = require('lib/Object/schema')

/**
 * Base
 */

var BaseInputSchema = ObjectSchema.discriminator('text', {
  correctAnswer: [String]
})

/**
 * Exports
 */

module.exports = BaseInputSchema