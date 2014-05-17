var PollSchema = require('./schema');

PollSchema.method('verb', function() {
  return 'assigned';
});

module.exports = {schema: PollSchema}