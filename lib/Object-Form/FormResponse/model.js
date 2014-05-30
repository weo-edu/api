var mongoose = require('mongoose');
var ResponseSchema = require('./schema');

ResponseSchema.method('verb', function() {
  return 'responded to';
});


// noop for response
ResponseSchema.method('transformOriginalContent', function() {});

module.exports = {schema: ResponseSchema};