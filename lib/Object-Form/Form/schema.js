var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');
var qs = require('querystring');

var FormSchema = module.exports = ObjectSchema.discriminator('form', {
  progress: selfLink.embed(function() {
    return '/share?' + qs.stringify({channel: this.path('progress')});
  }, ['progress', 'correct'])
});

FormSchema.plugin(selfLink);

FormSchema.Poll = FormSchema.discriminator('poll');
FormSchema.Quiz = FormSchema.discriminator('quiz');

FormSchema.Poll.plugin(selfLink);
FormSchema.Quiz.plugin(selfLink);