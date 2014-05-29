var mongoose = require('mongoose');
var QuestionSchema = require('./schema');

QuestionSchema.method('verb', function() {
  return 'asked';
});

module.exports = {schema: QuestionSchema}