var PostSchema = require('./schema');
var markdown = require('lib/markdown');
var strip = require('strip');

PostSchema.method('verb', function() {
  return 'shared';
});

// XXX This is duplicated in Question/model, it would be nice
// to not have to duplicate this code
PostSchema.pre('validate', function(next) {
  var share = this.share();

  if(share.isSheet() && (this.isModified('originalContent') || this.isNew)) {
    this.content = markdown(this.originalContent || '');
    this.displayName = strip(this.content);
  }

  next();
});

module.exports = {schema: PostSchema};