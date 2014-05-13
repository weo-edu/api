/**
 * Video
 *
 * @field displayName Video title.
 * @field content Video description.
 * @field url Link to original video.
 * @field image Thumbnail of video. (Width and Height preferred)
 * @field embed Link to embeddable video.
 */

module.exports = function(Schema) {
  var ObjectSchema = require('lib/Object/schema')(Schema);
  var ArticleSchema = ObjectSchema.discriminator('video', {
    displayName: {
      required: true
    },
    content: {
      required: true
    },
    image: {
      url: {
        required: true
      },
      type: {
        required: true
      }
    },
    embed: {
      url: {
        required: true
      },
      type: {
        required: true
      }
    }
  });
  return ArticleSchema;
}