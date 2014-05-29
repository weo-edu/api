/**
 * Article
 *
 * @field displayName Article title.
 * @field content Article blurb.
 * @field url Link to article.
 * @field image Article thumbnail.
 * @field fullImage Article full image.
 */

var ObjectSchema = require('lib/Object/schema')
var LinkSchema = module.exports = ObjectSchema.discriminator('link', {
  displayName: {
    required: true
  },
  content: {
    required: true
  }
});