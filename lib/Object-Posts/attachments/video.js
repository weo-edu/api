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
var VideoSchema = module.exports = ObjectSchema.discriminator('video', {
  providerName: {type: String},
  displayName: {
    required: true
  },
  content: {
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