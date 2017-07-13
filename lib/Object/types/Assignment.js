/**
 * Imports
 */

var ObjectSchema = require('lib/Object/schema')
var PointSchema = require('lib/Point')

/**
 * AssignmentSchema
 */

var AssignmentSchema = ObjectSchema.discriminator('assignment', {
  url: String,
  author: String,
  providerName: String,
  originalContent: String,
  description: String,
  displayName: String,
  image: {
    url: String
  },
  points: PointSchema.embed()
})

/**
 * Exports
 */

module.exports = AssignmentSchema
