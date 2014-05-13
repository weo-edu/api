module.exports = function(Schema) {
  var ObjectSchema = require('lib/Object/schema')(Schema);
  var CommentSchema = ObjectSchema.discriminator('comment', {});
  return CommentSchema;
}