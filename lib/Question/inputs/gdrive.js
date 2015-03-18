/**
 * shortAnswer
 *
 */
var BaseInputSchema = require('./base');
module.exports = BaseInputSchema.discriminator('gdrive', {
  fileId: {
    type: String,
    required: true
  },
  mimeType: String,
  name: String,
  url: String,
  iconUrl: String,
  embedUrl: String,
  type: String
});