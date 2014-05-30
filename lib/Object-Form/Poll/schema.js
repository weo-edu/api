var FormSchema = require('../Form/schema');
var selfLink = require('lib/schema-plugin-selflink');

var PollSchema = module.exports = FormSchema.discriminator('poll', {
  replies: {
    selfLink: String,
    total: [selfLink.totalSchema]
  }
});


