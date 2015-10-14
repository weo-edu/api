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
  completed: Boolean,
  longestStreak: Number,
  requiredStreak: Number,
  requiredCorrect: Number,
  points: PointSchema.embed()
})

KhanSchema.method('isGradable', function () {
  return true
})

/**
 * Exports
 */

module.exports = KhanSchema
