/**
 * Imports
 */

var ObjectSchema = require('lib/Object/schema')

/**
 * Post schema
 */

var PostSchema = ObjectSchema.discriminator('post', {
  originalContent: {
    type: String,
    required: true
  }
})

/**
 * Exports
 */

module.exports = PostSchema