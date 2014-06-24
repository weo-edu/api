var FormSchema = require('../Form/schema');
var selfLink = require('lib/schema-plugin-selflink');

module.exports = FormSchema.discriminator('poll', {
  replies: selfLink.embed()
});


