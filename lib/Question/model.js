var QuestionSchema = require('./schema');
var markdown = require('lib/markdown');
var strip = require('strip');

// XXX This is duplicated in Post/model, it would be nice
// to not have to duplicate this code
QuestionSchema.pre('validate', function(next) {
  if(this.isModified('originalContent') || this.isNew) {
    this.content = markdown(this.originalContent || '');
    this.displayName = strip(this.content);
  }

  next();
});

QuestionSchema.method('grade', function() {
  if(this.isAutoGradable())
    this.points.scaled = +this.isCorrect();
});

module.exports = {schema: QuestionSchema};