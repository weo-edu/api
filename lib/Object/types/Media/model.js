var MediaSchemas = require('./schema');
var scrape = require('lib/scrape');
var _ = require('lodash');

_.each(MediaSchemas, function(Schema) {
  Schema.path('originalContent').validate(function(url, done) {
    var model = this;
    var share = this.share();

    if(share.isSheet() && (model.isModified('originalContent') || model.isNew)) {
      scrape(url, function(err, data) {
        if(err) return done(false);

        data.originalContent = url;
        var id = model._id;
        model.fromJSON(data, {reset: false});
        model._id = id;
        done(true);
      });
    } else
      done(true);
  }, 'Invalid url', 'invalid');
});

module.exports = {Schemas: MediaSchemas};