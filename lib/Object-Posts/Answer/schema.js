module.exports = function(Schema) {
  var ObjectSchema = require('lib/Object/schema')(Schema);
  var AnswerSchema = ObjectSchema.discriminator('answer', {});
  return AnswerSchema;
}