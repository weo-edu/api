/**
 * Imports
 */

var PostSchema = require('lib/Object/types/Post/schema')

/**
 * Khan object schema
 */

var KhanSchema = PostSchema.discriminator('khan', {
  url: String
})

/**
 * Exports
 */

module.exports = KhanSchema