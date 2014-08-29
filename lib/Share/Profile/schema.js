var ObjectSchema = require('lib/Object/schema');

module.exports = ObjectSchema.discriminator('profile', {
  displayName: {
    type: String
  },
  content: {
    type: String
  }
});
