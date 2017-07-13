/**
 * Imports
 */

var ObjectSchema = require('lib/Object/schema')
var PointSchema = require('lib/Point')

/**
 * AssignmentItem
 */

var AssignmentItemSchema = ObjectSchema.discriminator('assignment_item', {
  guid: String,
  url: String,
  displayName: String,
  description: String,
  image: {
    url: String
  },
  points: PointSchema.embed()
})

/**
 * Exports
 */

module.exports = AssignmentItemSchema
