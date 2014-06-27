var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
var FormSchema = module.exports = ObjectSchema.extend({
  progress: selfLink.embed('progress', 'correct'),
  replies: selfLink.embed()
});

FormSchema.method('isLeaf', function() {
  return false;
});