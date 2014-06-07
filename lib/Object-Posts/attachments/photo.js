/**
 * Photo
 *
 * @field content Image file name.
 * @field url Link to view image.
 * @field image Link to uploaded image with preset width and height .
 * @field fullImage Link to uploaded image with no dimensions set.
 * @field fullImage.width Width of original image.
 * @field fullImage.height Height of original image.
 */

var ObjectSchema = require('lib/Object/schema');
var PhotoSchema = module.exports = ObjectSchema.discriminator('photo', {});

/* XXX Implment at some point
  content: {
    required: true
  }
  fullImage: {
    url: {
      required: true
    },
    type: {
      required: true
    },
    height: {
      required: true
    },
    width: {
      required: true
    }
  }*/