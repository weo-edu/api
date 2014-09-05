var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
var qs = require('querystring');

var FormSchema = ObjectSchema.extend({
  progress: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.getChannel('progress')});
  }, ['progress', 'correct'])
});

FormSchema.plugin(selfLink);
module.exports = FormSchema;