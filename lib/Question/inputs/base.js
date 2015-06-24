/**
 * Base
 *
 * @field correctAnswer stores the correctAnswer
 *
 */
var ObjectSchema = require('lib/Object/schema');
module.exports = ObjectSchema.discriminator('text', {
  correctAnswer: [String]
});