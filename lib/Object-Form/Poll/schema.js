module.exports = function(Schema) {
  var FormSchema = require('../Form/schema')(Schema);
  return FormSchema.discriminator('poll', {});
}