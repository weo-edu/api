var mongoose = require('mongoose');
var AnswerSchema = require('./schema')(mongoose.Schema);

AnswerSchema.method('verb', function() {
  return 'answered';
});

module.exports = {schema: AnswerSchema}