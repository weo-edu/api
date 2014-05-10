var mongoose = require('mongoose');
var ResponseSchema = require('./schema')(mongoose.Schema);

ResponseSchema.method('verb', function() {
  return 'answered';
});

module.exports = {schema: ResponseSchema};