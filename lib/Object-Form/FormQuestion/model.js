var FormQuestionSchema = require('./schema');

FormQuestionSchema.pre('validate', function(next) {
  this.setSelfLink('progress');
  next();
});

module.exports = {schema: FormQuestionSchema};