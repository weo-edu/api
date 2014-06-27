var AnswerSchema = require('./schema');

AnswerSchema.method('verb', function() {
  return 'answered';
});

module.exports = {schema: AnswerSchema};