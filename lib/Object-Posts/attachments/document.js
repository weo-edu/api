/**
 * Video
 *
 * @field displayName Video title.
 * @field content Video description.
 * @field url Link to original video.
 * @field image Thumbnail of video. (Width and Height preferred)
 * @field embed Link to embeddable video.
 */

var ObjectSchema = require('lib/Object/schema');
module.exports = ObjectSchema.discriminator('document', {
  displayName: {
    required: true
  },
  image: {
    url: {
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