var FormQuestionSchema = require('./schema');
var markdown = require('lib/markdown');
var strip = require('strip');

// XXX This is duplicated in Post/model, it would be nice
// to not have to duplicate this code
FormQuestionSchema.pre('validate', function(next) {
  if(this.isModified('originalContent') || this.isNew) {
    this.content = markdown(this.originalContent || '');
    this.displayName = strip(this.content);
  }

  next();
});

module.exports = {schema: FormQuestionSchema};