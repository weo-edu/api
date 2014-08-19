var FormSchema = require('./schema');

FormSchema.method('verb', function() {
  return 'assigned';
});

module.exports = {schema: FormSchema};