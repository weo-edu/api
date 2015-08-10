var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var async = require('async');
var scrape = require('lib/scrape');
var _ = require('lodash');

var types = ['link', 'video', 'image', 'document'];

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.map(function(doc, cb) {
      if(! (doc._object && doc._object[0]))
        return cb(null, doc)

      var arr = doc._object[0].attachments || [];
      var self = this;

      if (!arr.length)
        return cb(null, doc);

      async.each(arr, function(att, done) {
        if(att.originalContent && types.indexOf(att.objectType) !== -1) {
          scrape(att.originalContent, function(err, data) {
            if (err) return done();
            data.originalContent = att.originalContent;
            _.extend(att, data);
            done();
          });
        } else
          done();
      }, function(err) {
        cb(null, doc);
      });

    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
