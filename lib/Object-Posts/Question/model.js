var mongoose = require('mongoose');
var QuestionSchema = require('./schema')(mongoose.Schema);

QuestionSchema.method('verb', function() {
  return 'asked';
});

module.exports = {schema: QuestionSchema}