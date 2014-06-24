var FormSchema = require('./schema');

FormSchema.method('verb', function() {
  return 'assigned';
});

FormSchema.pre('validate', function(next) {
  this.setSelfLink('progress');
  this.setSelfLink('replies');
  next();
});

module.exports = {schema: FormSchema};