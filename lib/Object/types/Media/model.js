var MediaSchemas = require('./schema');
var scrape = require('lib/scrape');
var _ = require('lodash');

Error.stackTraceLimit = 500;
_.each(MediaSchemas, function(Schema) {
  Schema.pre('validate', function(next) {
    var model = this;
    var share = this.share();

    if(share.isSheet() && (model.isModified('originalContent') || model.isNew)) {
      scrape(model.originalContent, function(err, data) {
        if(err) return next(err);

        model.set(data);
        next();
      });
    } else
      next();
  });
});

module.exports = {Schemas: MediaSchemas};