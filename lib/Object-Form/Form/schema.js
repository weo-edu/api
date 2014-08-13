var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
module.exports = ObjectSchema.extend({
  progress: selfLink.embed('progress', 'correct'),
  replies: selfLink.embed()
});