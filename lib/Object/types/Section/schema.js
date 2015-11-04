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

SectionSchema.method('isGraded', function() {
  return this.attachments.every(function(obj) {
    return obj.isGraded()
  })
})

/**
 * Exports
 */

module.exports = SectionSchema