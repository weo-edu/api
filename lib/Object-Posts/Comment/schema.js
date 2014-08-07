var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');

module.exports = ObjectSchema.discriminator('comment', {
  originalContent: {
    type: String,
    required: true
  },
  votes: selfLink.embed('points')
});
