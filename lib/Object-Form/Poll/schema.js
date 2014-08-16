var FormSchema = require('../Form/schema');
var selfLink = require('lib/schema-plugin-selflink');
var PollSchema = FormSchema.discriminator('poll');

PollSchema.plugin(selfLink);
module.exports = PollSchema;