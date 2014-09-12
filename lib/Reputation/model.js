var ReputationSchema = require('./schema');

ReputationSchema.method('verb', function() {
  return 'received';
});

module.exports = {schema: ReputationSchema};