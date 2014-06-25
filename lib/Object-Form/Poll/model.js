var PollSchema = require('./schema');

PollSchema.method('verb', function() {
  return 'assigned';
});

PollSchema.pre('validate', function(next) {
  this.setSelfLink('replies');
  next();
});

module.exports = {schema: PollSchema};