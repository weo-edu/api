/**
 * Imports
 */

var PostSchema = require('lib/Object/types/Post/schema')
var PointSchema = require('lib/Point')

/**
 * Khan object schema
 */

var KhanSchema = PostSchema.discriminator('khan', {
  url: String,
  name: String,
  complete: Boolean,
  points: PointSchema.embed()
})

KhanSchema.method('isGradable', function () {
  return true
})

KhanSchema.method('grade', function () {
  this.complete
    ? test
    : tots
})

/**
 * Exports
 */

module.exports = KhanSchema
