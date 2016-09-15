/**
 * Imports
 */

var ObjectSchema = require('lib/Object/schema')

/**
 * Post schema
 */

var PostSchema = ObjectSchema.discriminator('post', {
  originalContent: {
    type: String
  }
})

/**
 * Exports
 */

module.exports = PostSchema
