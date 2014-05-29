var mongoose = require('mongoose');
var ResponseSchema = require('./schema');

ResponseSchema.method('verb', function() {
  return 'answered';
});

module.exports = {schema: ResponseSchema};