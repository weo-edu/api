var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
var FormSchema = ObjectSchema.extend({
  progress: selfLink.embed('progress', 'correct'),
  replies: selfLink.embed()
});

module.exports = FormSchema;