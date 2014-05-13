var mongoose = require('mongoose');
var PollSchema = require('./schema')(mongoose.Schema);

PollSchema.method('verb', function() {
  return 'assigned';
});

module.exports = {schema: PollSchema}