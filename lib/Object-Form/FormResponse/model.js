var ResponseSchema = require('./schema');

ResponseSchema.method('verb', function() {
  return 'responded to';
});

module.exports = {schema: ResponseSchema};