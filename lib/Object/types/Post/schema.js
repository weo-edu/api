var ObjectSchema = require('lib/Object/schema');
module.exports = ObjectSchema.discriminator('post', {
  originalContent: {
    type: String,
    required: true
  }
});