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
  criteria: String,
  done: {
    type: Boolean,
    default: false
  },
  required: Number,
  progress: Number,
  tracked: Boolean,
  points: PointSchema.embed()
})

KhanSchema.method('isGradable', function () {
  return this.tracked
})

KhanSchema.method('isAutoGradable', function () {
  return this.tracked
})

KhanSchema.method('isGraded', function () {
  var scaled = this.points.scaled
  return scaled !== null && scaled !== undefined
})

/**
 * Exports
 */

module.exports = KhanSchema
