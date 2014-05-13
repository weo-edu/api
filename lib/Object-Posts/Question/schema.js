module.exports = function(Schema) {
  var ObjectSchema = require('lib/Object/schema')(Schema);
  var QuestionSchema = ObjectSchema.discriminator('question', {});
  return QuestionSchema;
}