var ProfileSchema = require('./schema');

ProfileSchema.method('verb', function() {
  return 'changed';
});

module.exports = {schema: ProfileSchema};