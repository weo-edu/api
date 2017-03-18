/**
 * Imports
 */

var ObjectSchema = require('lib/Object/schema')
var PointSchema = require('lib/Point')

/**
 * Section schema
 */

var SectionSchema = ObjectSchema.discriminator('section', {
  points: PointSchema.embed()
})

/**
 * Exports
 */

module.exports = SectionSchema
