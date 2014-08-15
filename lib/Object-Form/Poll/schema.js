var FormSchema = require('../Form/schema');
var selfLink = require('lib/schema-plugin-selflink');
var PollSchema = FormSchema.discriminator('poll', {
  replies: selfLink.embed()
});

module.exports = PollSchema;