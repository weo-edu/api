/**
 * Article
 *
 * @field displayName Article title.
 * @field content Article blurb.
 * @field url Link to article.
 * @field image Article thumbnail.
 * @field fullImage Article full image.
 */

module.exports = function(Schema) {
  var ObjectSchema = require('lib/Object/schema')(Schema);
  var ArticleSchema = ObjectSchema.discriminator('article', {
    displayName: {
      required: true
    },
    content: {
      required: true
    },
    url: {
      required: true
    }
  });
  return ArticleSchema;
};