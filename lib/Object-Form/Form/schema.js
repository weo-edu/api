var ObjectSchema = require('lib/Object/schema');
var selfLink = require('lib/schema-plugin-selflink');

var FormSchema = module.exports = ObjectSchema.discriminator('form', {});

FormSchema.plugin(selfLink);

FormSchema.Poll = FormSchema.discriminator('poll');
FormSchema.Quiz = FormSchema.discriminator('quiz');

FormSchema.Poll.plugin(selfLink);
FormSchema.Quiz.plugin(selfLink);
